
import { Router } from 'express';

import { login, me, createClient } from '../controllers/authController.js';
import {
  listInvoices,
  getInvoice,
  createInvoice,
  clients,
  downloadInvoice
} from '../controllers/invoiceController.js';

import {
  checkout,
  verifyPayment
} from '../controllers/paymentController.js';

import { authenticate, requireRole } from '../middleware/auth.js';
import { db } from '../config/db.js';

const r = Router();

r.post('/auth/login', login);
r.get('/auth/me', authenticate, me);

r.get('/clients', authenticate, requireRole('Admin'), clients);
r.post('/clients', authenticate, requireRole('Admin'), createClient);

r.get('/invoices', authenticate, listInvoices);
r.post('/invoices', authenticate, requireRole('Admin'), createInvoice);
r.get('/invoices/:id', authenticate, getInvoice);
r.get('/invoices/:id/receipt', authenticate, downloadInvoice);

r.post('/invoices/:id/checkout', authenticate, checkout);
r.post('/invoices/:id/verify-payment', authenticate, verifyPayment);

r.get('/admin/overview', authenticate, requireRole('Admin'), (req, res) => {
  const total = db.prepare(
    'SELECT COUNT(*) count FROM invoices'
  ).get();

  const paid = db.prepare(
    "SELECT COALESCE(SUM(amount_cents),0) total FROM invoices WHERE status='Paid'"
  ).get();

  const pending = db.prepare(
    "SELECT COALESCE(SUM(amount_cents),0) total FROM invoices WHERE status='Pending'"
  ).get();

  const clientCount = db.prepare(
    "SELECT COUNT(*) count FROM users WHERE role='Client'"
  ).get();

  res.json({
    success: true,
    stats: {
      invoiceCount: total.count,
      revenue: paid.total / 100,
      outstanding: pending.total / 100,
      clientCount: clientCount.count
    }
  });
});

export default r;
