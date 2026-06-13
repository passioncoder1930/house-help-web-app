import { Review } from './review.model.js';
import { Booking } from '../bookings/booking.model.js';
import { ProviderProfile } from '../providers/provider.model.js';

export async function createReview(customerId, { bookingId, rating, comment }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  if (booking.customerId.toString() !== customerId.toString()) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }

  if (booking.status !== 'completed') {
    const err = new Error('Can only review completed bookings');
    err.status = 400;
    throw err;
  }

  const existing = await Review.findOne({ bookingId });
  if (existing) {
    const err = new Error('Review already exists for this booking');
    err.status = 409;
    throw err;
  }

  const review = await Review.create({
    bookingId,
    customerId,
    providerId: booking.providerId,
    rating,
    comment,
  });

  const provider = await ProviderProfile.findById(booking.providerId);
  if (provider) {
    const newCount = provider.rating.count + 1;
    const newAverage =
      (provider.rating.average * provider.rating.count + rating) / newCount;
    provider.rating = { average: Math.round(newAverage * 10) / 10, count: newCount };
    await provider.save();
  }

  return {
    id: review._id.toString(),
    bookingId: review.bookingId.toString(),
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}
