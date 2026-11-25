
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Download,
  ExternalLink
} from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CreateInvoice from './CreateInvoice';

const formatMoney = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: (currency || 'INR').toUpperCase()
  }).format(amount || 0);
};

export default function Invoices() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/invoices')
      .then(r => {
        setRows(r.data.invoices || []);
        setError('');
      })
      .catch(e => {
        setError(
          e.response?.data?.message ||
          'Unable to load invoices'
        );
      });
  };

  useEffect(() => {
    load();
  }, []);

  async function download(id) {
    try {
      const r = await api.get(`/invoices/${id}/receipt`, {
        responseType: 'blob'
      });

      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');

      a.href = url;
      a.download = 'VaultPay-receipt.pdf';
      a.click();

      URL.revokeObjectURL(url);
    } catch (e) {
      setError(
        e.response?.data?.message ||
        'Receipt download failed'
      );
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">BILLING MANAGEMENT</div>
          <h1>Invoices</h1>

          <p className="muted">
            {user.role === 'Admin'
              ? 'Manage client invoices and track collections.'
              : 'Review your invoices and payment history.'}
          </p>
        </div>

        {user.role === 'Admin' && (
          <button
            className="primary"
            onClick={() => setShow(true)}
          >
            <Plus size={17} /> Create invoice
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>All invoices</h2>
            <p className="muted">{rows.length} records</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>INVOICE</th>

                {user.role === 'Admin' && (
                  <th>CLIENT</th>
                )}

                <th>DESCRIPTION</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {rows.map(invoice => (
                <tr key={invoice.id}>
                  <td>
                    <Link
                      className="invoice-id"
                      to={`/invoices/${invoice.id}`}
                    >
                      {invoice.invoice_number}
                    </Link>
                  </td>

                  {user.role === 'Admin' && (
                    <td>{invoice.client_name}</td>
                  )}

                  <td>{invoice.title}</td>

                  <td className="amount">
                    {formatMoney(
                      invoice.amount,
                      invoice.currency
                    )}
                  </td>

                  <td>
                    <span
                      className={`status ${invoice.status.toLowerCase()}`}
                    >
                      {invoice.status}
                    </span>
                  </td>

                  <td>
                    <div className="actions">
                      <Link
                        className="icon-btn"
                        title="View details"
                        to={`/invoices/${invoice.id}`}
                      >
                        <ExternalLink size={16} />
                      </Link>

                      {invoice.status === 'Paid' && (
                        <button
                          className="icon-btn"
                          title="Download receipt"
                          onClick={() => download(invoice.id)}
                        >
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!rows.length && (
                <tr>
                  <td
                    colSpan={user.role === 'Admin' ? 6 : 5}
                    className="empty"
                  >
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {show && (
        <CreateInvoice
          onClose={() => setShow(false)}
          onCreated={() => {
            setShow(false);
            load();
          }}
        />
      )}
    </>
  );
}
