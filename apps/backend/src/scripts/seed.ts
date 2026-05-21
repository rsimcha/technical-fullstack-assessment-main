import 'reflect-metadata';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../utils/database';
import { UserModel } from '../models/User';
import {
  MaintenancePriority,
  MaintenanceRequestModel,
  MaintenanceStatus,
} from '../models/MaintenanceRequest';
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
    await MaintenanceRequestModel.deleteMany({});

    // Seed users (let pre-save hook handle password hashing)
    logger.info('👥 Seeding users...');
    const createdUsers = [];
    for (const userData of seedUsers) {
      const user = new UserModel(userData);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
    }
    logger.info(`✅ Created ${createdUsers.length} users`);

    const usersByEmail = new Map(
      createdUsers.map(u => [u.email, u])
    );
    const tenant = usersByEmail.get('tenant@doorloop.com')!;
    const manager = usersByEmail.get('manager@doorloop.com')!;
    const manager2 = usersByEmail.get('manager2@doorloop.com')!;

    const seedRequests = [
      {
        title: 'Leaking kitchen faucet',
        description:
          'Water drips constantly from the kitchen faucet, even when fully closed.',
        status: MaintenanceStatus.OPEN,
        priority: MaintenancePriority.HIGH,
        propertyId: 'Unit 4B - 123 Main St',
        createdBy: tenant._id,
      },
      {
        title: 'Window will not close properly',
        description:
          'Living room window sticks halfway and lets in cold air overnight.',
        status: MaintenanceStatus.OPEN,
        priority: MaintenancePriority.NORMAL,
        propertyId: 'Unit 4B - 123 Main St',
        createdBy: tenant._id,
      },
      {
        title: 'Broken thermostat',
        description:
          'Thermostat display is blank and heating is unresponsive.',
        status: MaintenanceStatus.IN_PROGRESS,
        priority: MaintenancePriority.URGENT,
        propertyId: 'Unit 2A - 123 Main St',
        createdBy: tenant._id,
        assignedTo: manager._id,
      },
      {
        title: 'Dishwasher making loud grinding noise',
        description:
          'Dishwasher runs but emits a loud grinding sound during the wash cycle.',
        status: MaintenanceStatus.IN_PROGRESS,
        priority: MaintenancePriority.NORMAL,
        propertyId: 'Unit 4B - 123 Main St',
        createdBy: tenant._id,
        assignedTo: manager2._id,
      },
      {
        title: 'Replace hallway light fixture',
        description:
          'Overhead light in the hallway flickered for a week then stopped working.',
        status: MaintenanceStatus.COMPLETED,
        priority: MaintenancePriority.NORMAL,
        propertyId: 'Unit 4B - 123 Main St',
        createdBy: tenant._id,
        assignedTo: manager2._id,
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
      {
        title: 'Carpet stain in hallway',
        description: 'Small stain near the entryway carpet.',
        status: MaintenanceStatus.CANCELLED,
        priority: MaintenancePriority.LOW,
        propertyId: 'Unit 4B - 123 Main St',
        createdBy: tenant._id,
      },
    ];

    logger.info('🛠  Seeding maintenance requests...');
    const createdRequests = await MaintenanceRequestModel.insertMany(
      seedRequests
    );
    logger.info(
      `✅ Created ${createdRequests.length} maintenance requests`
    );

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
