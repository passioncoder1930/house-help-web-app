import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { ServiceCategory } from '../modules/categories/category.model.js';
import { User } from '../modules/users/user.model.js';
import { ProviderProfile } from '../modules/providers/provider.model.js';

const categories = [
  { name: 'Cleaning', slug: 'cleaning', icon: 'cleaning_services', description: 'Home cleaning and deep cleaning', sortOrder: 1 },
  { name: 'Cooking', slug: 'cooking', icon: 'restaurant', description: 'Meal prep and cooking assistance', sortOrder: 2 },
  { name: 'Laundry', slug: 'laundry', icon: 'local_laundry_service', description: 'Washing, ironing, and folding', sortOrder: 3 },
  { name: 'Plumbing', slug: 'plumbing', icon: 'plumbing', description: 'Pipe repairs and installations', sortOrder: 4 },
  { name: 'Electrical', slug: 'electrical', icon: 'electrical_services', description: 'Wiring and electrical fixes', sortOrder: 5 },
  { name: 'Babysitting', slug: 'babysitting', icon: 'child_care', description: 'Child care services', sortOrder: 6 },
  { name: 'Elderly Care', slug: 'elderly_care', icon: 'elderly', description: 'Senior care and companionship', sortOrder: 7 },
  { name: 'Gardening', slug: 'gardening', icon: 'yard', description: 'Lawn care and plant maintenance', sortOrder: 8 },
  { name: 'Pest Control', slug: 'pest_control', icon: 'pest_control', description: 'Pest removal and prevention', sortOrder: 9 },
];

async function seed() {
  await mongoose.connect(env.mongodbUri);
  console.log('Connected to MongoDB for seeding');

  await ServiceCategory.deleteMany({});
  const createdCategories = await ServiceCategory.insertMany(categories);
  console.log(`Seeded ${createdCategories.length} categories`);

  const passwordHash = await bcrypt.hash('password123', 10);

  await User.deleteMany({ email: { $in: ['customer@demo.com', 'provider@demo.com', 'provider2@demo.com'] } });

  const customer = await User.create({
    name: 'Demo Customer',
    email: 'customer@demo.com',
    phone: '9876543210',
    passwordHash,
    role: 'customer',
    addresses: [
      { label: 'Home', line1: '42 MG Road', city: 'Bangalore', pincode: '560001', isDefault: true },
    ],
  });

  const providerUser1 = await User.create({
    name: 'Priya Sharma',
    email: 'provider@demo.com',
    phone: '9876543211',
    passwordHash,
    role: 'provider',
  });

  const providerUser2 = await User.create({
    name: 'Raj Kumar',
    email: 'provider2@demo.com',
    phone: '9876543212',
    passwordHash,
    role: 'provider',
  });

  await ProviderProfile.deleteMany({ userId: { $in: [providerUser1._id, providerUser2._id] } });

  await ProviderProfile.create({
    userId: providerUser1._id,
    bio: 'Professional home cleaner with 5 years experience. Eco-friendly products used.',
    serviceCategories: [createdCategories[0]._id, createdCategories[2]._id],
    hourlyRate: 350,
    serviceArea: { city: 'Bangalore', pincode: '560001' },
    rating: { average: 4.8, count: 24 },
    isAvailable: true,
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
    ],
  });

  await ProviderProfile.create({
    userId: providerUser2._id,
    bio: 'Licensed plumber and electrician. Available for emergency repairs.',
    serviceCategories: [createdCategories[3]._id, createdCategories[4]._id],
    hourlyRate: 500,
    serviceArea: { city: 'Bangalore', pincode: '560034' },
    rating: { average: 4.5, count: 18 },
    isAvailable: true,
    availability: [
      { dayOfWeek: 0, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 6, startTime: '10:00', endTime: '16:00' },
    ],
  });

  console.log('Demo accounts created:');
  console.log('  Customer: customer@demo.com / password123');
  console.log('  Provider: provider@demo.com / password123');
  console.log('  Provider: provider2@demo.com / password123');

  await mongoose.disconnect();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
