import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const providerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, default: '' },
    serviceCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory' }],
    hourlyRate: { type: Number, required: true, min: 0 },
    serviceArea: {
      city: { type: String, required: true },
      pincode: { type: String },
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isAvailable: { type: Boolean, default: true },
    availability: [availabilitySchema],
  },
  { timestamps: true }
);

providerProfileSchema.index({ 'serviceArea.city': 1 });
providerProfileSchema.index({ serviceCategories: 1 });

export const ProviderProfile = mongoose.model('ProviderProfile', providerProfileSchema);
