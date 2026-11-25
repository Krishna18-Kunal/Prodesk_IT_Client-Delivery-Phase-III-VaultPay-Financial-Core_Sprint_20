# VaultPay Financial Core

## 1. Project Planning

```text
Act as a senior full-stack developer.

Help me build a professional B2B Invoice and Payment Management
System named VaultPay Financial Core.

The application should support Admin and Client roles,
invoice management, secure authentication, payment processing,
and PDF receipt generation.

Use React, Vite, Node.js, Express, SQLite, and Razorpay.
Provide a clear project structure and step-by-step implementation.
```

## 2. Backend Development

```text
Build a REST API using Node.js and Express for VaultPay.

Requirements:
- JWT authentication
- Admin and Client roles
- Password hashing with bcryptjs
- Invoice CRUD operations
- Client management
- SQLite database using better-sqlite3
- Input validation
- Centralized error handling
- Secure authorization middleware

Use clean, modular, beginner-friendly code.
```

## 3. Frontend Development

```text
Build a modern and responsive React frontend for VaultPay.

Include:
- Login page
- Admin dashboard
- Client dashboard
- Invoice listing
- Invoice creation form
- Invoice detail page
- Client management
- Payment interface
- Protected routes

Use React, Vite, CSS, and reusable components.
Create a professional financial SaaS dashboard UI.
```

## 4. Razorpay Integration

```text
Integrate Razorpay Test Mode into VaultPay.

Requirements:
- Create Razorpay orders from the backend.
- Use INR currency and paise for payment amounts.
- Open Razorpay Checkout on the frontend.
- Verify payment signatures using HMAC SHA256.
- Never trust frontend payment status alone.
- Implement a Razorpay payment.captured webhook.
- Verify webhook signatures using the raw request body.
- Update invoice status only after verified payment capture.
- Store payment and order IDs.
```

## 5. PDF Receipt Generation

```text
Implement automatic PDF receipt generation.

Requirements:
- Generate receipts after verified payment capture.
- Include invoice number and payment details.
- Include customer and company information.
- Include amount, currency, and payment ID.
- Store generated receipts securely.
- Provide an authenticated receipt download endpoint.
```

## 6. Email Notifications

```text
Implement optional SMTP email notifications using Nodemailer.

Requirements:
- Send payment receipt emails after successful payment capture.
- Attach the generated PDF receipt.
- Read SMTP settings from environment variables.
- Skip email sending gracefully when SMTP is not configured.
- Prevent duplicate receipt email attempts where possible.
```

## 7. Security Improvements

```text
Review the VaultPay application for security issues.

Check:
- Authentication and authorization
- Admin-only API access
- Client invoice ownership
- Payment signature verification
- Webhook signature verification
- Environment variable protection
- Sensitive data exposure
- Duplicate webhook processing
- Input validation and error handling

Suggest practical fixes without breaking existing functionality.
```

## 8. Debugging and Troubleshooting

```text
Act as an experienced Node.js and React debugging assistant.

Analyze the error I provide.
Identify the root cause.
Explain the issue in simple language.
Provide the exact corrected code.
Give step-by-step commands for Windows CMD.
Do not change unrelated files or existing functionality.
```

## 9. Testing and Validation

```text
Help me test the VaultPay application.

Validate:
- Admin login
- Client login
- Role-based access
- Invoice creation
- Invoice ownership restrictions
- Razorpay order creation
- Payment signature verification
- Webhook signature validation
- Payment capture and invoice status update
- PDF receipt generation
- Email receipt functionality

Provide expected outputs for every test.
Never claim a test passed without actual evidence.
```

## 10. Documentation and GitHub

```text
Prepare professional GitHub documentation for VaultPay Financial Core.

Include:
- Project overview
- Features
- Technology stack
- Project structure
- Installation instructions
- Environment configuration
- Demo credentials
- Payment workflow
- Security features
- Future enhancements

Use clean Markdown formatting and accurate project details.
```

## 11. Deployment Preparation

```text
Prepare VaultPay Financial Core for production deployment.

Review:
- Frontend and backend environment variables
- API base URLs
- Database persistence
- HTTPS configuration
- Razorpay production credentials
- Webhook endpoint configuration
- Secure secret management
- CORS settings
- Build and start commands

Do not expose secrets or hardcode credentials.
```

---
