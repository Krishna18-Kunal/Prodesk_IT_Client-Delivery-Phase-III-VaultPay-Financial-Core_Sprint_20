
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import api from './routes/api.js';
import { razorpayWebhook } from './controllers/paymentController.js';
import { notFound, errorHandler } from './middleware/error.js';
import './config/db.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));
app.use(morgan('dev'));

// Razorpay webhook must receive the original raw request body.
app.post(
  '/api/webhooks/razorpay',
  express.raw({ type: 'application/json' }),
  razorpayWebhook
);

app.use(express.json({ limit: '1mb' }));

app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30
  })
);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'VaultPay API is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api', api);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`VaultPay API listening on port ${port}`);
});
