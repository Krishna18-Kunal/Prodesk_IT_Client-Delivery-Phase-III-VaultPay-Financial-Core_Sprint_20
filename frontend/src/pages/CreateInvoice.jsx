
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';

export default function CreateInvoice({ onClose, onCreated }) {
  const [clients, setClients] = useState([]);

  const [form, setForm] = useState({
    clientId: '',
    title: '',
    description: '',
    amount: '',
    dueDate: ''
  });

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadClients() {
      try {
        const response = await api.get('/clients');
        const list = response.data.clients || [];

        setClients(list);

        if (list.length > 0) {
          setForm(current => ({
            ...current,
            clientId: String(list[0].id)
          }));
        } else {
          setError('No clients found. Please add a client first.');
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Unable to load clients. Please check your login.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, []);

  const change = (e) => {
    setForm(current => ({
      ...current,
      [e.target.name]: e.target.value
    }));
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      await api.post('/invoices', {
        ...form,
        amount: Number(form.amount)
      });

      onCreated();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not create invoice'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">

        <div className="modal-head">
          <div>
            <div className="eyebrow">NEW BILLING RECORD</div>
            <h2>Create invoice</h2>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        {loading ? (
          <p>Loading clients...</p>
        ) : (
          <form onSubmit={submit}>

            <label>Client</label>

            <select
              name="clientId"
              value={form.clientId}
              onChange={change}
              required
            >
              <option value="">Select client</option>

              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} — {client.company}
                </option>
              ))}
            </select>

            <label>Invoice title</label>

            <input
              name="title"
              value={form.title}
              onChange={change}
              required
              minLength="3"
            />

            <label>Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={change}
            />

            <div className="form-row">

              <div>
                <label>Amount (INR ₹)</label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  name="amount"
                  value={form.amount}
                  onChange={change}
                  required
                />
              </div>

              <div>
                <label>Due date</label>

                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={change}
                />
              </div>

            </div>

            {error && <p className="error">{error}</p>}

            <div className="modal-actions">

              <button
                type="button"
                className="secondary"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                className="primary"
                disabled={busy || !clients.length}
              >
                {busy ? 'Creating...' : 'Create invoice'}
              </button>

            </div>
          </form>
        )}

      </div>
    </div>
  );
}
