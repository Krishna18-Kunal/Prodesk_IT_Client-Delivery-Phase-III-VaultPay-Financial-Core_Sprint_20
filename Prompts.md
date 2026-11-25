# Prompts.md — AI Assistance & Transparency

This file records representative prompts used to plan, implement, review, and troubleshoot VaultPay Financial Core. AI output was treated as a draft: code was reviewed against the Sprint 20 brief, adjusted, and tested locally. No API keys, passwords, webhook secrets, customer secrets, or real financial data should be entered into AI prompts.

## 1. Architecture and project structure
**Prompt:**
> Act as a senior full-stack engineer. Design a secure B2B invoice and payment portal using React + Vite, Node.js + Express, SQLite, JWT, bcrypt, Stripe Checkout, Stripe webhooks, PDFKit and Nodemailer. Separate Admin and Client roles. Provide a maintainable folder structure, API contracts, local setup, and deployment plan. Prioritize server-side authorization and IDOR prevention.

**Applied:** Separated frontend, backend controllers, middleware, routes, and services. Kept Stripe, PDF, and email operations server-side.

## 2. JWT authentication and RBAC
**Prompt:**
> Implement Express JWT authentication middleware. Verify Bearer tokens, load the current user from the database, and implement a reusable role middleware for Admin and Client. Return 401 for missing/invalid tokens and 403 for authenticated users without the required role. Never trust a role supplied by the frontend.

**Applied:** `backend/src/middleware/auth.js` verifies JWT and reloads the user record. Admin-only endpoints use `requireRole('Admin')`. React route guards improve navigation UX but are not treated as security boundaries.

## 3. IDOR / invoice ownership
**Prompt:**
> Review an invoice API for IDOR. A client must never read, download, or pay an invoice belonging to another client, even if they know or guess its UUID. Show the correct SQL ownership check and consistent 403 behavior. Admins may access all invoices.

**Applied:** Invoice detail, checkout, and receipt endpoints compare the stored `client_id` against `req.user.id`. Client invoice list queries are filtered in SQL. The frontend does not determine ownership.

## 4. Stripe Checkout and double-click prevention
**Prompt:**
> Create a Stripe Checkout Session server-side for a pending invoice. Derive amount and currency from the database, never from request body. Validate invoice ownership, reject already-paid invoices, return only the Checkout URL, and prevent repeated checkout creation. In React, disable the payment button immediately while the request is pending and prevent duplicate clicks.

**Applied:** `paymentController.js` reads amount/currency from the invoice record and creates a card Checkout Session. `InvoiceDetail.jsx` uses a busy state and disables the button during the request. Backend status checks and Stripe idempotency add defense in depth.

## 5. Raw-body webhook signature verification
**Prompt:**
> Implement an Express Stripe webhook securely. Stripe signature verification must use `stripe.webhooks.constructEvent` and the unmodified raw request body. Explain middleware ordering, event deduplication, payment state transition, and safe error responses. Never accept a frontend success callback as proof of payment.

**Applied:** The webhook route is mounted before `express.json()` using `express.raw({type:'application/json'})`. The handler verifies `stripe-signature`, deduplicates Stripe event IDs, checks payment status/session/amount/currency, and only then changes a Pending invoice to Paid.

## 6. PDF receipt buffer/file generation
**Prompt:**
> Using PDFKit in Node.js, generate a professional A4 payment receipt with company heading, receipt/invoice number, client identity, description, amount, paid date, payment reference, and a visible PAID mark. Write the stream safely to a server-side storage directory and resolve only after the file stream finishes. Do not expose arbitrary filesystem paths to clients.

**Applied:** `backend/src/services/pdf.js` creates the PDF on the server and resolves after the write stream finishes. Receipt paths remain in the database and are not accepted from the client.

## 7. Nodemailer receipt email
**Prompt:**
> Create a Nodemailer service that sends the generated PDF receipt as an attachment to the email address loaded from the database. Read SMTP configuration only from environment variables. If SMTP is not configured in development, log a clear warning without leaking credentials.

**Applied:** `backend/src/services/email.js` loads the SMTP settings from environment variables and attaches the generated PDF. No SMTP secret is hard-coded.

## 8. Frontend UX and secure document download
**Prompt:**
> Build a responsive invoice portal with an Admin dashboard, Client invoice list, invoice details, clear Pending/Paid/Cancelled badges, secure payment CTA, and PDF download using an authenticated Axios request with responseType blob. Add loading, empty, and error states. Use a polished corporate fintech visual system.

**Applied:** React pages and reusable layout components provide role-specific navigation, invoice tables, status badges, loading/error states, and authenticated PDF download.

## 9. Security audit checklist
**Prompt:**
> Perform a threat-model review of this training payment portal. Check missing JWT enforcement, admin route authorization, IDOR, trusting client amount/status, webhook raw-body parsing, webhook signature verification, replay/idempotency, duplicate checkout, secret exposure, CORS, rate limiting, and PDF path traversal. List concrete tests and fixes.

**Applied:** Added Helmet, CORS origin restriction, login rate limiting, Zod validation, server-derived invoice amount, ownership checks, webhook signature verification, webhook event deduplication, and server-controlled receipt paths.

## 10. Deployment and configuration
**Prompt:**
> Write deployment steps for a Vite frontend on Vercel and Express API on Render. Include environment variable names, persistent storage considerations for SQLite/PDF files, Stripe production webhook setup, CORS origin configuration, and a warning not to commit .env files.

**Applied:** Deployment instructions are documented in `README.md`. Production credentials must be configured in hosting dashboards, not committed to Git.

---

## Manual verification performed / to perform before submission
- [ ] Login succeeds for Admin and Client demo users.
- [ ] Unauthenticated API calls return 401.
- [ ] Client calling `GET /api/admin/overview` returns 403.
- [ ] Client A requesting Client B invoice detail returns 403.
- [ ] Client invoice list contains only their own invoices.
- [ ] Checkout button disables while session creation is pending.
- [ ] Stripe test card completes checkout in test mode.
- [ ] Invalid webhook signature returns HTTP 400.
- [ ] Valid webhook changes invoice to Paid exactly once.
- [ ] Duplicate webhook event does not generate another receipt/email.
- [ ] PDF receipt contains invoice/client/amount/payment reference and PAID mark.
- [ ] Receipt email reaches the account email when SMTP is configured.
- [ ] `.env`, database files, and generated receipts are excluded from Git.

AI tools assisted with scaffolding and review. The project owner remains responsible for understanding, testing, and validating all code and configuration before deployment.
