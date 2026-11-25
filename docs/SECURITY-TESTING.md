# Security test plan

Use the demo accounts and local API at `http://localhost:5000`. Obtain a Client B invoice ID by logging in as Admin and listing invoices. Never run destructive tests against production data.

## 1. Client cannot call Admin API
```bash
curl -i http://localhost:5000/api/admin/overview -H "Authorization: Bearer CLIENT_JWT"
```
Expected: `403 Forbidden`.

## 2. Client cannot access another client's invoice
```bash
curl -i http://localhost:5000/api/invoices/OTHER_CLIENT_INVOICE_UUID -H "Authorization: Bearer CLIENT_A_JWT"
```
Expected: `403 Forbidden`.

## 3. Unauthenticated request
```bash
curl -i http://localhost:5000/api/invoices
```
Expected: `401 Authentication required`.

## 4. Invalid webhook signature
```bash
curl -i -X POST http://localhost:5000/api/webhooks/stripe -H "Content-Type: application/json" -H "Stripe-Signature: invalid" --data '{}'
```
Expected: `400 Webhook Error`.

## 5. Payment integrity
- Change amount/status in browser devtools: server must ignore client-side changes.
- Try checkout for an invoice owned by a different client: expected 403.
- Try checkout after invoice is Paid: expected 409.
- Replay a Stripe event: event ID deduplication should prevent duplicate processing.

## Important note
The React route guard is not a substitute for backend authorization. Always test the API directly with Postman/curl using the Client token.
