import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.js';
import {
  getMyProviderProfile,
  getProviderById,
  getProviderReviews,
  listProviders,
  updateAvailability,
  upsertProviderProfile,
} from './provider.service.js';

const router = Router();

const profileSchema = z.object({
  bio: z.string().optional(),
  serviceCategories: z.array(z.string()).min(1),
  hourlyRate: z.number().positive(),
  serviceArea: z.object({
    city: z.string().min(1),
    pincode: z.string().optional(),
  }),
  isAvailable: z.boolean().optional(),
  availability: z
    .array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
      })
    )
    .optional(),
});

const availabilitySchema = z.object({
  availability: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
    })
  ),
});

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const result = await listProviders({
      category: req.query.category,
      city: req.query.city,
      page,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/me/profile', authenticate, requireRole('provider'), async (req, res, next) => {
  try {
    const profile = await getMyProviderProfile(req.user._id);
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const provider = await getProviderById(req.params.id);
    res.json({ provider });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const result = await getProviderReviews(req.params.id, page);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/profile', authenticate, requireRole('provider'), async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const profile = await upsertProviderProfile(req.user._id, data);
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

router.patch('/availability', authenticate, requireRole('provider'), async (req, res, next) => {
  try {
    const data = availabilitySchema.parse(req.body);
    const profile = await updateAvailability(req.user._id, data.availability);
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

export default router;
