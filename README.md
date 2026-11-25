# VaultPay Financial Core

A full-stack B2B invoicing and payment portal for Nexus Corporate Services. This implementation covers the Prodesk IT Sprint 20 brief: Admin/Client RBAC, JWT authentication, invoice ownership checks (IDOR prevention), Stripe Checkout, signed Stripe webhooks, PDF receipts, and email delivery.

## Stack
- Frontend: React 18, Vite, React Router, Axios, Lucide
- Backend: Node.js (ES modules), Express
- Database: SQLite via better-sqlite3
- Security: bcrypt, JWT, Helmet, CORS, rate limiting, Zod validation
- Payments: Stripe Checkout + webhook signature verification
- Documents/email: PDFKit + Nodemailer

## Repository layout
```text
VaultPay-Financial-Core/
├── backend/
│   ├── src/config/db.js
│   ├── src/controllers/       # auth, invoices, checkout/webhook
│   ├── src/middleware/        # JWT, roles, error handling
│   ├── src/routes/api.js
│   ├── src/services/          # PDF receipt and email
│   ├── src/server.js
│   ├── src/seed.js
│   └── .env.example
├── frontend/
│   ├── src/components/        # layout and route guard
│   ├── src/context/           # auth context
│   ├── src/pages/             # login, dashboards, clients, invoices
│   └── .env.example
├── docs/
└── Prompts.md
```

## Requirements
- Node.js 20 LTS recommended
- npm
- Stripe account in test mode
- Gmail App Password or another SMTP provider for email (optional for local UI testing)
- Stripe CLI for local webhook forwarding

## Run locally (Windows PowerShell or CMD)
Open two terminals.

### 1. Backend
```bash
cd backend
npm install
```
Copy `.env.example` to `.env`, then set at minimum:
- `JWT_SECRET` to a long random secret (32+ characters)
- `STRIPE_SECRET_KEY` to your Stripe test secret (`sk_test_...`)
- `CLIENT_URL=http://localhost:5173`

Seed demo users and a sample invoice:
```bash
npm run seed
```
Start the API:
```bash
npm run dev
```
Health check: `http://localhost:5000/api/health`

### 2. Frontend
```bash
cd frontend
npm install
```
Copy `.env.example` to `.env` (default API URL is correct for local use), then:
```bash
npm run dev
```
Open `http://localhost:5173`.

## Demo credentials
| Role | Email | Password |
|---|---|---|
| Admin | `admin@vaultpay.demo` | `Admin@12345` |
| Client | `jordan@client.demo` | `Client@12345` |
| Client | `taylor@client.demo` | `Client@12345` |

These are development-only demo credentials. Never use them in production. Change/remove seeded accounts before public deployment.

## Stripe local webhook testing
The webhook endpoint must receive the original raw request body. The server mounts `/api/webhooks/stripe` with `express.raw()` before `express.json()` for this reason.

1. Install and authenticate Stripe CLI: `stripe login`
2. Start backend on port 5000.
3. In another terminal run:
```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```
4. Copy the `whsec_...` signing secret printed by Stripe CLI into `backend/.env` as `STRIPE_WEBHOOK_SECRET`.
5. Restart backend after changing environment variables.
6. Sign in as a Client, open a Pending invoice, click Pay, and use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC, and any postal code.
7. Inspect the backend terminal for webhook activity. Confirm invoice status becomes Paid and the PDF receipt appears under `backend/storage/receipts/`.

Use Stripe's official test card documentation for other scenarios. Do not use real card details in test mode.

## API reference
All protected routes require `Authorization: Bearer <JWT>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/me` | Authenticated | Current account |
| GET | `/api/admin/overview` | Admin | Revenue, outstanding, counts |
| GET | `/api/clients` | Admin | List clients |
| POST | `/api/clients` | Admin | Create a client login |
| GET | `/api/invoices` | Admin/Client | Admin sees all; client sees own only |
| POST | `/api/invoices` | Admin | Create invoice |
| GET | `/api/invoices/:id` | Admin/Owner | Read invoice with ownership check |
| POST | `/api/invoices/:id/checkout` | Admin/Owner | Create Stripe Checkout Session |
| GET | `/api/invoices/:id/receipt` | Admin/Owner | Download paid PDF receipt |
| POST | `/api/webhooks/stripe` | Stripe signature | Verified payment events |
| GET | `/api/health` | Public | Health check |

## Security design notes
1. JWT verification is performed by backend middleware; client-side route guards are UX only.
2. Admin routes use `requireRole('Admin')` on the server.
3. Invoice detail, checkout and receipt endpoints compare `invoice.client_id` with the authenticated user's ID. A guessed invoice UUID is not authorization.
4. Client invoice listing is filtered in SQL by the authenticated user ID.
5. The frontend cannot mark an invoice Paid. Only the Stripe webhook changes status.
6. Webhook signatures are verified using `stripe.webhooks.constructEvent` against the raw request body.
7. Webhook event IDs are stored to make event processing idempotent. The payment update also uses a conditional `WHERE status='Pending'` update.
8. Webhook payment details are cross-checked against the stored Stripe session, invoice amount and currency before marking Paid.
9. Checkout button locks while the request is in flight; server-side invoice status and Stripe session idempotency provide additional protection.
10. Secrets are read from environment variables and must never be committed.

## Production deployment outline

### Backend (Render)
- Create a Web Service from the repository; root directory `backend`.
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables from `.env.example` using real production values.
- Set `NODE_ENV=production`, `CLIENT_URL` to the deployed frontend origin, and a persistent disk mount for SQLite and generated receipts (for example `/var/data`). Set `DATABASE_PATH=/var/data/vaultpay.sqlite`.
- Configure Stripe production webhook destination: `https://YOUR-API-DOMAIN/api/webhooks/stripe`; subscribe to `checkout.session.completed`; set the resulting signing secret as `STRIPE_WEBHOOK_SECRET`.
- Configure SMTP credentials. Gmail requires a Google App Password with 2-Step Verification; never use the normal Gmail password.

### Frontend (Vercel)
- Import repository; set Root Directory to `frontend`.
- Framework: Vite. Build command `npm run build`; output directory `dist`.
- Add `VITE_API_URL=https://YOUR-API-DOMAIN/api`.
- Configure the backend CORS `CLIENT_URL` to the exact deployed frontend origin.

### Important production upgrade
SQLite on a persistent single-instance disk is acceptable for this demo. For a commercial multi-instance service, migrate to managed PostgreSQL, add durable object storage (S3/R2) for receipts, use a transactional outbox/queue for webhook email jobs, and implement audit logs, backup/restore, monitoring, and formal secret rotation. Do not run this starter with demo credentials or without persistent storage.

## Known scope
- Admin can create invoices and create client accounts through the protected API. The UI includes client listing; a client-creation form can be added if required by the client workflow.
- PDF receipt generation is triggered after verified payment. SMTP is optional during development; if not configured, the webhook logs that email was skipped while retaining the generated PDF.
- This is a training/demo implementation, not a certified financial product or legal/accounting system.
