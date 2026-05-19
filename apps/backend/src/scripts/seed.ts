import 'reflect-metadata';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../utils/database';
import { UserModel } from '../models/User';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

// Seed users for testing authentication
const seedUsers = [
  {
    email: 'admin@doorloop.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isEmailVerified: true,
  },
  {
    email: 'manager@doorloop.com',
    password: 'manager123',
    firstName: 'Manager',
    lastName: 'User',
    role: 'manager',
    isEmailVerified: true,
  },
  {
    email: 'tenant@doorloop.com',
    password: 'tenant123',
    firstName: 'Tenant',
    lastName: 'User',
    role: 'tenant',
    isEmailVerified: true,
  },
  {
    email: 'manager2@doorloop.com',
    password: 'manager123',
    firstName: 'Sarah',
    lastName: 'Wilson',
    role: 'manager',
    isEmailVerified: true,
  },
];


async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seeding...');

    await connectDB();

    // Clear existing data
    logger.info('🗑️ Clearing existing data...');
    await UserModel.deleteMany({});

    // Seed users (let pre-save hook handle password hashing)
    logger.info('👥 Seeding users...');
    const createdUsers = [];
    for (const userData of seedUsers) {
      const user = new UserModel(userData);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
    }
    logger.info(`✅ Created ${createdUsers.length} users`);

    logger.info('🎉 Database seeding completed successfully!');
    logger.info('');
    logger.info('📋 Test Accounts:');
    logger.info('Admin: admin@doorloop.com / admin123');
    logger.info('Manager: manager@doorloop.com / manager123');
    logger.info('Manager 2: manager2@doorloop.com / manager123');
    logger.info('Tenant: tenant@doorloop.com / tenant123');
    logger.info('');
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
