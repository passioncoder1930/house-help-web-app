import { Booking } from './booking.model.js';
import { ProviderProfile } from '../providers/provider.model.js';

const VALID_TRANSITIONS = {
  pending: { provider: ['accepted', 'cancelled'], customer: ['cancelled'] },
  accepted: { provider: ['in_progress', 'cancelled'], customer: ['cancelled'] },
  in_progress: { provider: ['completed'] },
  completed: {},
  cancelled: {},
};

function formatBooking(booking) {
  const customer = booking.customerId;
  const provider = booking.providerId;
  const category = booking.categoryId;

  return {
    id: booking._id.toString(),
    status: booking.status,
    scheduledAt: booking.scheduledAt,
    durationHours: booking.durationHours,
    address: booking.address,
    notes: booking.notes,
    price: booking.price,
    currency: booking.currency,
    statusHistory: booking.statusHistory,
    customer: customer
      ? {
          id: customer._id?.toString() || customer.toString(),
          name: customer.name || 'Customer',
          phone: customer.phone,
        }
      : undefined,
    provider: provider
      ? {
          id: provider._id?.toString() || provider.toString(),
          name: provider.userId?.name || 'Provider',
          hourlyRate: provider.hourlyRate,
        }
      : undefined,
    category: category
      ? {
          id: category._id?.toString() || category.toString(),
          name: category.name,
          slug: category.slug,
          icon: category.icon,
        }
      : undefined,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

export async function createBooking(customerId, data) {
  const provider = await ProviderProfile.findById(data.providerId);
  if (!provider) {
    const err = new Error('Provider not found');
    err.status = 404;
    throw err;
  }

  if (!provider.isAvailable) {
    const err = new Error('Provider is not available');
    err.status = 400;
    throw err;
  }

  const durationHours = data.durationHours || 2;
  const price = provider.hourlyRate * durationHours;

  const booking = await Booking.create({
    customerId,
    providerId: data.providerId,
    categoryId: data.categoryId,
    scheduledAt: new Date(data.scheduledAt),
    durationHours,
    address: data.address,
    notes: data.notes,
    price,
    statusHistory: [{ status: 'pending', by: customerId }],
  });

  const populated = await Booking.findById(booking._id)
    .populate('customerId', 'name phone')
    .populate({ path: 'providerId', populate: { path: 'userId', select: 'name' } })
    .populate('categoryId', 'name slug icon');

  return formatBooking(populated);
}

export async function listBookings(user, { status, upcoming } = {}) {
  let filter;
  if (user.role === 'customer') {
    filter = { customerId: user._id };
  } else {
    const profile = await ProviderProfile.findOne({ userId: user._id });
    if (!profile) return [];
    filter = { providerId: profile._id };
  }

  if (status) filter.status = status;
  if (upcoming === 'true') {
    filter.scheduledAt = { $gte: new Date() };
    filter.status = { $in: ['pending', 'accepted', 'in_progress'] };
  }

  const bookings = await Booking.find(filter)
    .populate('customerId', 'name phone')
    .populate({ path: 'providerId', populate: { path: 'userId', select: 'name' } })
    .populate('categoryId', 'name slug icon')
    .sort({ scheduledAt: -1 });

  return bookings.map(formatBooking);
}

async function getProviderProfileId(userId) {
  const profile = await ProviderProfile.findOne({ userId });
  if (!profile) {
    const err = new Error('Provider profile not found');
    err.status = 404;
    throw err;
  }
  return profile._id;
}

export async function getBookingById(id, user) {
  const booking = await Booking.findById(id)
    .populate('customerId', 'name phone')
    .populate({ path: 'providerId', populate: { path: 'userId', select: 'name phone' } })
    .populate('categoryId', 'name slug icon');

  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  await assertBookingAccess(booking, user);
  return formatBooking(booking);
}

async function assertBookingAccess(booking, user) {
  const isCustomer = booking.customerId._id?.toString() === user._id.toString();

  let isProvider = false;
  if (user.role === 'provider') {
    const profile = await ProviderProfile.findOne({ userId: user._id });
    isProvider = profile && booking.providerId._id?.toString() === profile._id.toString();
  }

  if (!isCustomer && !isProvider) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }
}

export async function updateBookingStatus(id, user, newStatus) {
  const booking = await Booking.findById(id)
    .populate('customerId', 'name phone')
    .populate({ path: 'providerId', populate: { path: 'userId', select: 'name' } })
    .populate('categoryId', 'name slug icon');

  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  const role = user.role;
  const current = booking.status;
  const allowed = VALID_TRANSITIONS[current]?.[role] || [];

  if (!allowed.includes(newStatus)) {
    const err = new Error(`Cannot transition from ${current} to ${newStatus}`);
    err.status = 400;
    throw err;
  }

  if (role === 'provider') {
    const profile = await ProviderProfile.findOne({ userId: user._id });
    if (!profile || booking.providerId._id.toString() !== profile._id.toString()) {
      const err = new Error('Access denied');
      err.status = 403;
      throw err;
    }
  }

  if (role === 'customer' && booking.customerId._id.toString() !== user._id.toString()) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }

  booking.status = newStatus;
  booking.statusHistory.push({ status: newStatus, by: user._id });
  await booking.save();

  return formatBooking(booking);
}

export async function cancelBooking(id, user) {
  return updateBookingStatus(id, user, 'cancelled');
}

export async function getProviderDashboardStats(userId) {
  const profile = await ProviderProfile.findOne({ userId });
  if (!profile) {
    return { pendingCount: 0, todayCount: 0, completedCount: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [pendingCount, todayCount, completedCount] = await Promise.all([
    Booking.countDocuments({ providerId: profile._id, status: 'pending' }),
    Booking.countDocuments({
      providerId: profile._id,
      status: { $in: ['accepted', 'in_progress'] },
      scheduledAt: { $gte: today, $lt: tomorrow },
    }),
    Booking.countDocuments({ providerId: profile._id, status: 'completed' }),
  ]);

  return { pendingCount, todayCount, completedCount };
}
