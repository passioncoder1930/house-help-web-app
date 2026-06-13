import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import providerRoutes from './modules/providers/provider.routes.js';
import bookingRoutes from './modules/bookings/booking.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';

const app = express();

app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin }));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, please try again later.' },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

// app.use(errorHandler);
let isConnected = false;

app.use(async (_req, _res, next) => {
  if (!isConnected) {
    await connectDb();
    isConnected = true;
  }
  next();
});

export default app;