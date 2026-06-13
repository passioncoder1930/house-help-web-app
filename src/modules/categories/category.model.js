import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String, required: true },
    description: { type: String },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ServiceCategory = mongoose.model('ServiceCategory', categorySchema);
