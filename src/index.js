import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectDb } from './config/db.js';

import authRoutes from './modules/auth/auth.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import providerRoutes from './modules/providers/provider.routes.js';
import bookingRoutes from './modules/bookings/booking.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin }));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

app.use(async (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

let isConnected = false;

async function initDb() {
  if (!isConnected) {
    await connectDb();
    isConnected = true;
  }
}

await initDb();

export default app;