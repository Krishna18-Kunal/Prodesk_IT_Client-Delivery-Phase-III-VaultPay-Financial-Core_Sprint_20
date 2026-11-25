
import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';

export async function createReceipt(invoice, client) {
  const dir = path.resolve('storage/receipts');
  fs.mkdirSync(dir, { recursive: true });

  const file = path.join(
    dir,
    `${invoice.invoice_number}-receipt.pdf`
  );

  const paymentReference =
    invoice.razorpay_payment_id ||
    invoice.stripe_payment_intent ||
    'Payment reference unavailable';

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 55
    });

    const out = fs.createWriteStream(file);

    doc.pipe(out);

    doc.save()
      .roundedRect(55, 48, 34, 34, 8)
      .fill('#10233f')
      .restore();

    doc.fontSize(18)
      .fillColor('#ffffff')
      .text('N', 64, 55, { width: 18, align: 'center' });

    doc.fontSize(20)
      .fillColor('#10233f')
      .text('NEXUS CORPORATE SERVICES', 100, 52);

    doc.moveDown(1.1)
      .fontSize(10)
      .fillColor('#64748b')
      .text('PAYMENT RECEIPT | VAULTPAY FINANCIAL CORE');

    doc.moveDown(2)
      .fontSize(34)
      .fillColor('#15803d')
      .text('PAID');

    doc.moveDown()
      .fontSize(12)
      .fillColor('#0f172a')
      .text(`Receipt for ${invoice.invoice_number}`);

    doc.moveDown()
      .fontSize(11)
      .text(`Billed to: ${client.name} (${client.email})`);

    doc.text(`Company: ${client.company || 'N/A'}`);
    doc.text(`Invoice: ${invoice.title}`);
    doc.text(`Description: ${invoice.description || 'Professional services'}`);
    doc.text(`Payment date: ${invoice.paid_at || new Date().toISOString()}`);
    doc.text(`Payment reference: ${paymentReference}`);
    doc.text('Payment gateway: Razorpay');

    doc.moveDown(2)
      .fontSize(14)
      .fillColor('#10233f')
      .text(
        `Amount paid: ${Number(invoice.amount_cents / 100).toLocaleString(
          'en-IN',
          {
            style: 'currency',
            currency: invoice.currency.toUpperCase()
          }
        )}`
      );

    doc.moveDown(3)
      .fontSize(9)
      .fillColor('#64748b')
      .text(
        'This document confirms that payment was received. Please retain it for your records.'
      );

    doc.end();

    out.on('finish', resolve);
    out.on('error', reject);
  });

  return file;
}
