import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderProfile', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    scheduledAt: { type: Date, required: true },
    durationHours: { type: Number, default: 2, min: 1 },
    address: {
      line1: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String },
    },
    notes: { type: String },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

bookingSchema.index({ providerId: 1, status: 1 });
bookingSchema.index({ customerId: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
