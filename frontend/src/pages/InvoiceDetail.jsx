
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  LockKeyhole,
  CreditCard
} from 'lucide-react';
import api from '../services/api';

const formatMoney = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount || 0);
};

export default function InvoiceDetail() {
  const { id } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/invoices/${id}`)
      .then(r => setInvoice(r.data.invoice))
      .catch(e => setError(
        e.response?.data?.message || 'Unable to load invoice'
      ));
  }, [id]);

  async function refreshInvoice() {
    const r = await api.get(`/invoices/${id}`);
    setInvoice(r.data.invoice);
    return r.data.invoice;
  }

  async function pay() {
    if (busy || !invoice || invoice.status !== 'Pending') return;

    if (invoice.currency?.toLowerCase() !== 'inr') {
      setError('Razorpay checkout currently supports INR invoices only.');
      return;
    }

    if (!window.Razorpay) {
      setError('Razorpay Checkout could not load. Please refresh the page.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const r = await api.post(`/invoices/${id}/checkout`);

      const options = {
        key: r.data.keyId,
        amount: r.data.amount,
        currency: r.data.currency,
        name: 'VaultPay',
        description: invoice.invoice_number,
        order_id: r.data.orderId,

        prefill: {
          name: invoice.client_name || '',
          email: invoice.client_email || ''
        },

        theme: {
          color: '#635bff'
        },

        handler: async function (response) {
          setMessage('Verifying payment. Please wait...');

          try {
            await api.post(
              `/invoices/${id}/verify-payment`,
              response
            );

            setMessage(
              'Payment submitted successfully. Waiting for Razorpay webhook confirmation...'
            );

            // Only the verified webhook changes invoice status to Paid.
            for (let attempt = 0; attempt < 15; attempt++) {
              await new Promise(resolve => setTimeout(resolve, 2000));

              const updated = await refreshInvoice();

              if (updated.status === 'Paid') {
                setMessage('Payment confirmed! Your receipt is ready.');
                setBusy(false);
                return;
              }
            }

            setMessage(
              'Payment verification received. Your invoice will update after Razorpay confirms the webhook.'
            );
          } catch (e) {
            setError(
              e.response?.data?.message ||
              'Payment verification failed. Please contact support.'
            );
          } finally {
            setBusy(false);
          }
        },

        modal: {
          ondismiss: function () {
            setBusy(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on('payment.failed', function (response) {
        setError(
          response.error?.description ||
          'Payment failed. Please try again.'
        );
        setBusy(false);
      });

      paymentObject.open();
    } catch (e) {
      setError(
        e.response?.data?.message ||
        'Could not start Razorpay checkout'
      );
      setBusy(false);
    }
  }

  async function download() {
    try {
      const r = await api.get(`/invoices/${id}/receipt`, {
        responseType: 'blob'
      });

      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');

      a.href = url;
      a.download = `${invoice.invoice_number}-receipt.pdf`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (e) {
      setError(
        e.response?.data?.message || 'Download failed'
      );
    }
  }

  if (!invoice) {
    return <div>{error || 'Loading invoice...'}</div>;
  }

  const currency = invoice.currency || 'inr';
  const isINR = currency.toLowerCase() === 'inr';

  return (
    <>
      <Link to="/invoices" className="back-link">
        <ArrowLeft size={16} /> Back to invoices
      </Link>

      <div className="page-heading detail-heading">
        <div>
          <div className="eyebrow">INVOICE DETAIL</div>
          <h1>{invoice.invoice_number}</h1>
          <p className="muted">
            Issued {new Date(invoice.created_at).toLocaleDateString()}
          </p>
        </div>

        <span className={`status large ${invoice.status.toLowerCase()}`}>
          {invoice.status}
        </span>
      </div>

      {error && <div className="error">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="detail-grid">
        <div className="panel invoice-paper">
          <div className="paper-top">
            <div>
              <b>NEXUS CORPORATE SERVICES</b>
              <small>VAULTPAY FINANCIAL CORE</small>
            </div>
            <span>INVOICE</span>
          </div>

          <div className="paper-meta">
            <div>
              <small>BILLED TO</small>
              <b>{invoice.client_name || 'Your account'}</b>
              <span>{invoice.client_email || ''}</span>
            </div>

            <div>
              <small>INVOICE NUMBER</small>
              <b>{invoice.invoice_number}</b>
              <small>DUE DATE</small>
              <b>{invoice.due_date || 'Upon receipt'}</b>
            </div>
          </div>

          <h2>{invoice.title}</h2>
          <p className="muted">
            {invoice.description || 'Professional services'}
          </p>

          <div className="amount-line">
            <span>Invoice total</span>
            <strong>
              {formatMoney(invoice.amount, currency)}
            </strong>
          </div>

          <div className="paper-foot">
            <LockKeyhole size={15} />
            Secure billing document · Nexus Corporate Services
          </div>
        </div>

        <div className="panel payment-panel">
          <div className="eyebrow">PAYMENT SUMMARY</div>

          <h2>{formatMoney(invoice.amount, currency)}</h2>

          <p className="muted">
            {invoice.status === 'Paid'
              ? 'Payment successfully received.'
              : 'Amount due'}
          </p>

          <div className="summary-line">
            <span>Status</span>
            <b>{invoice.status}</b>
          </div>

          <div className="summary-line">
            <span>Currency</span>
            <b>{currency.toUpperCase()}</b>
          </div>

          <div className="summary-line">
            <span>Payment method</span>
            <b>Razorpay · UPI / Cards</b>
          </div>

          {invoice.status === 'Pending' && isINR && (
            <button
              className="primary full pay-btn"
              onClick={pay}
              disabled={busy}
            >
              <CreditCard size={17} />
              {busy ? 'Processing payment...' : 'Pay invoice securely'}
            </button>
          )}

          {invoice.status === 'Pending' && !isINR && (
            <p className="muted">
              This existing invoice uses {currency.toUpperCase()}.
              Razorpay checkout currently requires an INR invoice.
            </p>
          )}

          {invoice.status === 'Paid' && (
            <button
              className="primary full"
              onClick={download}
            >
              <Download size={17} /> Download PDF receipt
            </button>
          )}

          <small className="secure-note">
            <LockKeyhole size={13} />
            Payments are processed securely by Razorpay.
          </small>
        </div>
      </div>
    </>
  );
}
