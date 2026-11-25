
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || './storage/vaultpay.sqlite';

fs.mkdirSync(path.dirname(path.resolve(dbPath)), {
  recursive: true
});

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Admin','Client')),
  company TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'inr',
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK(status IN ('Pending','Paid','Cancelled')),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT UNIQUE,
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  receipt_path TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_client
ON invoices(client_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status
ON invoices(status);
`);

// Safely add Razorpay columns to an existing database.
const columns = db.prepare('PRAGMA table_info(invoices)').all();
const columnNames = columns.map(column => column.name);

if (!columnNames.includes('razorpay_order_id')) {
  db.exec('ALTER TABLE invoices ADD COLUMN razorpay_order_id TEXT');
}

if (!columnNames.includes('razorpay_payment_id')) {
  db.exec('ALTER TABLE invoices ADD COLUMN razorpay_payment_id TEXT');
}

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_razorpay_order
ON invoices(razorpay_order_id)
WHERE razorpay_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_razorpay_payment
ON invoices(razorpay_payment_id)
WHERE razorpay_payment_id IS NOT NULL;
`);
// Track receipt email delivery to prevent duplicate emails.
const updatedColumns = db.prepare(
  'PRAGMA table_info(invoices)'
).all();

const updatedColumnNames = updatedColumns.map(column => column.name);

if (!updatedColumnNames.includes('receipt_email_sent_at')) {
  db.exec(`
    ALTER TABLE invoices
    ADD COLUMN receipt_email_sent_at TEXT
  `);
}