import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.js';
import {
  cancelBooking,
  createBooking,
  getBookingById,
  getProviderDashboardStats,
  listBookings,
  updateBookingStatus,
} from './booking.service.js';

const router = Router();

const createSchema = z.object({
  providerId: z.string(),
  categoryId: z.string(),
  scheduledAt: z.string().datetime(),
  durationHours: z.number().min(1).optional(),
  address: z.object({
    line1: z.string().min(1),
    city: z.string().min(1),
    pincode: z.string().optional(),
  }),
  notes: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(['accepted', 'in_progress', 'completed', 'cancelled']),
});

router.post('/', authenticate, requireRole('customer'), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const booking = await createBooking(req.user._id, data);
    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const bookings = await listBookings(req.user, req.query);
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', authenticate, requireRole('provider'), async (req, res, next) => {
  try {
    const stats = await getProviderDashboardStats(req.user._id);
    res.json({ stats });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const booking = await getBookingById(req.params.id, req.user);
    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const booking = await updateBookingStatus(req.params.id, req.user, status);
    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, requireRole('customer'), async (req, res, next) => {
  try {
    const booking = await cancelBooking(req.params.id, req.user);
    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

export default router;
