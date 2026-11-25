
import Razorpay from 'razorpay';
import crypto from 'node:crypto';

import { db } from '../config/db.js';
import { AppError } from '../utils/errors.js';
import { createReceipt } from '../services/pdf.js';
import { sendReceiptEmail } from '../services/email.js';

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new AppError('Razorpay is not configured', 503);
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// Create or reuse a Razorpay order.
export async function checkout(req, res, next) {
  try {
    const invoice = db.prepare(
      'SELECT * FROM invoices WHERE id = ?'
    ).get(req.params.id);

    if (!invoice) throw new AppError('Invoice not found', 404);

    if (req.user.role !== 'Admin' && invoice.client_id !== req.user.id) {
      throw new AppError('You do not have access to this invoice', 403);
    }

    if (invoice.status !== 'Pending') {
      throw new AppError('Only pending invoices can be paid', 409);
    }

    if (invoice.currency.toLowerCase() !== 'inr') {
      throw new AppError(
        'This invoice is not configured for INR payments. Update its currency first.',
        409
      );
    }

    const razorpay = getRazorpay();
    let order;

    if (invoice.razorpay_order_id) {
      try {
        order = await razorpay.orders.fetch(invoice.razorpay_order_id);
      } catch {
        order = null;
      }
    }

    if (!order) {
      order = await razorpay.orders.create({
        amount: invoice.amount_cents,
        currency: 'INR',
        receipt: invoice.invoice_number,
        notes: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
        },
      });

      db.prepare(
        'UPDATE invoices SET razorpay_order_id = ? WHERE id = ?'
      ).run(order.id, invoice.id);
    }

    return res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        title: invoice.title,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Verify Checkout response signature.
// The webhook remains authoritative for marking invoices Paid.
export function verifyPayment(req, res, next) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new AppError(
        'Missing Razorpay payment verification details',
        400
      );
    }

    const invoice = db.prepare(
      'SELECT * FROM invoices WHERE id = ?'
    ).get(req.params.id);

    if (!invoice) throw new AppError('Invoice not found', 404);

    if (req.user.role !== 'Admin' && invoice.client_id !== req.user.id) {
      throw new AppError('You do not have access to this invoice', 403);
    }

    if (invoice.razorpay_order_id !== razorpay_order_id) {
      throw new AppError('Payment order does not match this invoice', 400);
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new AppError('Razorpay is not configured', 503);
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const received = Buffer.from(razorpay_signature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      throw new AppError('Invalid Razorpay payment signature', 400);
    }

    return res.json({
      success: true,
      message:
        'Payment signature verified. Waiting for the Razorpay webhook to confirm payment.',
    });
  } catch (error) {
    next(error);
  }
}

// Razorpay webhook: only a captured payment can mark an invoice as Paid.
export async function razorpayWebhook(req, res) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret || !signature || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook configuration or body',
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    const received = Buffer.from(signature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    const event = JSON.parse(req.body.toString('utf8'));

    const eventId =
      req.headers['x-razorpay-event-id'] ||
      crypto.createHash('sha256').update(req.body).digest('hex');

    const alreadyProcessed = db.prepare(
      'SELECT id FROM webhook_events WHERE id = ?'
    ).get(eventId);

    if (alreadyProcessed) {
      return res.json({
        received: true,
        duplicate: true,
      });
    }

    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;

      if (payment?.order_id && payment?.status === 'captured') {
        const invoice = db.prepare(
          'SELECT * FROM invoices WHERE razorpay_order_id = ?'
        ).get(payment.order_id);

        if (
          invoice &&
          payment.amount === invoice.amount_cents &&
          payment.currency?.toLowerCase() === invoice.currency.toLowerCase()
        ) {
          if (invoice.status === 'Pending') {
            db.prepare(`
              UPDATE invoices
              SET status = 'Paid',
                  razorpay_payment_id = ?,
                  paid_at = CURRENT_TIMESTAMP
              WHERE id = ? AND status = 'Pending'
            `).run(payment.id, invoice.id);
          }

          const paid = db.prepare(
            'SELECT * FROM invoices WHERE id = ?'
          ).get(invoice.id);

          if (paid.status === 'Paid') {
            const client = db.prepare(
              'SELECT * FROM users WHERE id = ?'
            ).get(invoice.client_id);

            if (!client) {
              throw new Error('Invoice client not found');
            }

            let file = paid.receipt_path;

            if (!file) {
              file = await createReceipt(paid, client);

              db.prepare(`
                UPDATE invoices
                SET receipt_path = ?
                WHERE id = ? AND receipt_path IS NULL
              `).run(file, invoice.id);
            }

            // Prevent duplicate receipt emails.
            const emailStatus = db.prepare(`
              SELECT receipt_email_sent_at
              FROM invoices
              WHERE id = ?
            `).get(invoice.id);

            if (!emailStatus?.receipt_email_sent_at) {
              try {
                const emailResult = await sendReceiptEmail({
                  to: client.email,
                  name: client.name,
                  invoiceNumber: invoice.invoice_number,
                  pdfPath: file,
                });

                if (emailResult?.sent) {
                  db.prepare(`
                    UPDATE invoices
                    SET receipt_email_sent_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                      AND receipt_email_sent_at IS NULL
                  `).run(invoice.id);

                  console.log(
                    `Receipt email sent for ${invoice.invoice_number}`
                  );
                } else {
                  console.log(
                    `Receipt email skipped for ${invoice.invoice_number}:`,
                    emailResult?.reason || 'Email not sent'
                  );
                }
              } catch (mailError) {
                console.error(
                  'Receipt email delivery failed:',
                  mailError.message
                );
              }
            } else {
              console.log(
                `Receipt email already sent for ${invoice.invoice_number}`
              );
            }
          }
        }
      }
    }

    db.prepare(
      'INSERT INTO webhook_events(id, event_type) VALUES(?, ?)'
    ).run(eventId, event.event || 'unknown');

    return res.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook processing failed:', error);

    return res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
}
