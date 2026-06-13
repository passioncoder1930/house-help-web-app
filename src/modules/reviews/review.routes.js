import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { createReview } from './review.service.js';

const router = Router();

const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

router.post('/', authenticate, requireRole('customer'), async (req, res, next) => {
  try {
    const data = reviewSchema.parse(req.body);
    const review = await createReview(req.user._id, data);
    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
});

export default router;
