import { ProviderProfile } from './provider.model.js';
import { Review } from '../reviews/review.model.js';

export function formatProvider(profile, user) {
  return {
    id: profile._id.toString(),
    userId: profile.userId.toString(),
    name: user?.name || 'Provider',
    avatarUrl: user?.avatarUrl,
    bio: profile.bio,
    serviceCategories: (profile.serviceCategories || []).map((c) =>
      typeof c === 'object' && c._id
        ? { id: c._id.toString(), name: c.name, slug: c.slug, icon: c.icon }
        : { id: c.toString() }
    ),
    hourlyRate: profile.hourlyRate,
    serviceArea: profile.serviceArea,
    rating: profile.rating,
    isAvailable: profile.isAvailable,
    availability: profile.availability || [],
  };
}

export async function listProviders({ category, city, page = 1, limit = 20 }) {
  const filter = { isAvailable: true };
  if (category) filter.serviceCategories = category;
  if (city) filter['serviceArea.city'] = new RegExp(city, 'i');

  const skip = (page - 1) * limit;
  const [profiles, total] = await Promise.all([
    ProviderProfile.find(filter)
      .populate('userId', 'name avatarUrl')
      .populate('serviceCategories', 'name slug icon')
      .sort({ 'rating.average': -1 })
      .skip(skip)
      .limit(limit),
    ProviderProfile.countDocuments(filter),
  ]);

  return {
    providers: profiles.map((p) => formatProvider(p, p.userId)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getProviderById(id) {
  const profile = await ProviderProfile.findById(id)
    .populate('userId', 'name avatarUrl phone')
    .populate('serviceCategories', 'name slug icon description');

  if (!profile) {
    const err = new Error('Provider not found');
    err.status = 404;
    throw err;
  }

  return formatProvider(profile, profile.userId);
}

export async function upsertProviderProfile(userId, data) {
  const profile = await ProviderProfile.findOneAndUpdate(
    { userId },
    {
      userId,
      bio: data.bio,
      serviceCategories: data.serviceCategories,
      hourlyRate: data.hourlyRate,
      serviceArea: data.serviceArea,
      isAvailable: data.isAvailable ?? true,
      availability: data.availability || [],
    },
    { new: true, upsert: true, runValidators: true }
  )
    .populate('userId', 'name avatarUrl')
    .populate('serviceCategories', 'name slug icon');

  return formatProvider(profile, profile.userId);
}

export async function updateAvailability(userId, availability) {
  const profile = await ProviderProfile.findOneAndUpdate(
    { userId },
    { availability },
    { new: true }
  )
    .populate('userId', 'name avatarUrl')
    .populate('serviceCategories', 'name slug icon');

  if (!profile) {
    const err = new Error('Provider profile not found');
    err.status = 404;
    throw err;
  }

  return formatProvider(profile, profile.userId);
}

export async function getProviderReviews(providerId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find({ providerId })
      .populate('customerId', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ providerId }),
  ]);

  return {
    reviews: reviews.map((r) => ({
      id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      customer: {
        name: r.customerId?.name || 'Customer',
        avatarUrl: r.customerId?.avatarUrl,
      },
      createdAt: r.createdAt,
    })),
    pagination: { page, limit, total },
  };
}

export async function getMyProviderProfile(userId) {
  const profile = await ProviderProfile.findOne({ userId })
    .populate('userId', 'name avatarUrl')
    .populate('serviceCategories', 'name slug icon');

  if (!profile) return null;
  return formatProvider(profile, profile.userId);
}
