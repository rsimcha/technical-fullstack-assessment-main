import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-users-integration';

import app from '../index';
import { UserModel } from '../models/User';

let mongo: MongoMemoryServer;

const signToken = (userId: string) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

const seedUser = async (overrides: {
  email: string;
  role: 'admin' | 'manager' | 'tenant';
  firstName: string;
  lastName: string;
}) => {
  const user = await UserModel.create({
    email: overrides.email,
    password: 'password123',
    firstName: overrides.firstName,
    lastName: overrides.lastName,
    role: overrides.role,
  });
  return { user, token: signToken(user._id.toString()) };
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await UserModel.deleteMany({});
});

describe('GET /api/users?role=', () => {
  it('returns only users with the requested role, sorted by first and last name', async () => {
    const { token } = await seedUser({
      email: 'auth@x.com',
      role: 'admin',
      firstName: 'Auth',
      lastName: 'User',
    });
    await seedUser({
      email: 'zoe.manager@x.com',
      role: 'manager',
      firstName: 'Zoe',
      lastName: 'Adams',
    });
    await seedUser({
      email: 'amy.manager@x.com',
      role: 'manager',
      firstName: 'Amy',
      lastName: 'Zimmer',
    });
    await seedUser({
      email: 'tenant@x.com',
      role: 'tenant',
      firstName: 'Tenant',
      lastName: 'User',
    });

    const res = await request(app)
      .get('/api/users?role=manager')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: 'Users retrieved successfully',
    });
    expect(res.body.data.users).toHaveLength(2);
    expect(res.body.data.users.map((u: { email: string }) => u.email)).toEqual([
      'amy.manager@x.com',
      'zoe.manager@x.com',
    ]);
    expect(res.body.data.users).toEqual([
      expect.objectContaining({
        firstName: 'Amy',
        lastName: 'Zimmer',
        email: 'amy.manager@x.com',
      }),
      expect.objectContaining({
        firstName: 'Zoe',
        lastName: 'Adams',
        email: 'zoe.manager@x.com',
      }),
    ]);
  });

  it('returns all users when no role filter is provided', async () => {
    const { token } = await seedUser({
      email: 'admin@x.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
    });
    await seedUser({
      email: 'manager@x.com',
      role: 'manager',
      firstName: 'Manager',
      lastName: 'User',
    });
    await seedUser({
      email: 'tenant@x.com',
      role: 'tenant',
      firstName: 'Tenant',
      lastName: 'User',
    });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.users).toHaveLength(3);
    expect(res.body.data.users.map((u: { email: string }) => u.email)).toEqual(
      ['admin@x.com', 'manager@x.com', 'tenant@x.com']
    );
  });

  it('does not expose password or reset token fields', async () => {
    const { token } = await seedUser({
      email: 'admin@x.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
    });
    await seedUser({
      email: 'manager@x.com',
      role: 'manager',
      firstName: 'Manager',
      lastName: 'User',
    });

    const res = await request(app)
      .get('/api/users?role=manager')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.users[0]).not.toHaveProperty('password');
    expect(res.body.data.users[0]).not.toHaveProperty('resetPasswordToken');
    expect(res.body.data.users[0]).not.toHaveProperty('resetPasswordExpires');
  });

  it('returns 400 when role is not one of the supported values', async () => {
    const { token } = await seedUser({
      email: 'admin@x.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
    });

    const res = await request(app)
      .get('/api/users?role=owner')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'role',
        }),
      ])
    );
  });

  it('returns 401 when the request is unauthenticated', async () => {
    const res = await request(app).get('/api/users?role=manager');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 403 when the caller is a tenant', async () => {
    const { token } = await seedUser({
      email: 'tenant@x.com',
      role: 'tenant',
      firstName: 'Tenant',
      lastName: 'User',
    });

    const res = await request(app)
      .get('/api/users?role=manager')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
