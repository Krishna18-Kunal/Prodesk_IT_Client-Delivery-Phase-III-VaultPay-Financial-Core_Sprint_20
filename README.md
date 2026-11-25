# VaultPay – Financial Core

A secure B2B Invoice and Payment Management System built with React, Node.js, Express, SQLite, and Razorpay.

## Key Features

- Secure JWT-based authentication
- Role-based access control (Admin and Client)
- Invoice creation and management
- Client management
- Razorpay payment gateway integration
- Payment verification using HMAC signatures
- Webhook-based payment confirmation
- Automated PDF receipt generation
- Optional email receipts through SMTP
- Invoice payment status tracking
- SQLite database integration

## Technology Stack

**Frontend**
- React.js
- Vite
- JavaScript
- HTML5
- CSS3

**Backend**
- Node.js
- Express.js
- REST API
- JWT Authentication
- bcryptjs

**Database**
- SQLite
- better-sqlite3

**Payment Integration**
- Razorpay Test Mode
- Razorpay Webhooks

**Other Tools**
- Git and GitHub
- Nodemailer
- PDFKit

## Project Structure

```text
VaultPay-Financial-Core/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── seed.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── main.jsx
│   │   └── style.css
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── README.md
└── Prompts.md
```

###  Backend Setup

```bash
cd VaultPay-Financial-Core/backend
npm install
```

Create a `.env` file using `.env.example` as a reference.

Configure your environment variables:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=1d

DATABASE_PATH=./storage/vaultpay.sqlite

RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
MAIL_FROM=VaultPay <your_email@gmail.com>
```

Run database seeding:

```bash
npm run seed
```

Start backend:

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

### Frontend Setup

Open another terminal:

```bash
cd VaultPay-Financial-Core/frontend
npm install
```

Create `.env` using `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start frontend:

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## Payment Workflow

1. Admin creates an invoice for a client.
2. Client logs into the application.
3. Client opens the invoice and initiates payment.
4. Backend creates a Razorpay order.
5. Razorpay Checkout handles the payment.
6. Backend verifies the payment signature.
7. Razorpay sends a `payment.captured` webhook.
8. Backend validates the webhook signature and payment details.
9. Invoice status is updated to Paid.
10. PDF receipt is generated and optionally emailed.

**Important:** Payment confirmation depends on the verified Razorpay webhook, not only the frontend checkout response.

## Security

- JWT-based authentication
- Password hashing
- Role-based authorization
- Client invoice ownership validation
- Razorpay payment signature verification
- Webhook signature verification
- Environment variables for sensitive credentials
- Idempotent webhook event handling

## Author

**Krishna Kunal**
