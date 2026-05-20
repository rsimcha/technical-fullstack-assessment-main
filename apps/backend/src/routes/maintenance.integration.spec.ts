/**
 * Integration tests for the maintenance routes — real Express app, real
 * Mongoose, real Zod, against an in-process mongodb-memory-server.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-integration';

import app from '../index';
import { UserModel } from '../models/User';
import {
  MaintenancePriority,
  MaintenanceRequestModel,
  MaintenanceStatus,
} from '../models/MaintenanceRequest';

let mongo: MongoMemoryServer;

const signToken = (userId: string) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

const seedUser = async (overrides: {
  email: string;
  role: 'admin' | 'manager' | 'tenant';
  firstName?: string;
  lastName?: string;
}) => {
  const user = await UserModel.create({
    email: overrides.email,
    password: 'password123', // hashed by pre-save hook
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'User',
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
  await MaintenanceRequestModel.deleteMany({});
  await UserModel.deleteMany({});
});

describe('POST /api/maintenance', () => {
  it('lets a tenant create a request and stores it with status=open and createdBy=actor', async () => {
    const { user, token } = await seedUser({
      email: 'tenant@x.com',
      role: 'tenant',
    });

    const body = {
      title: 'Leaky faucet',
      description: 'Drips overnight',
      propertyId: 'unit-101',
      priority: 'high',
    };

    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.request).toMatchObject({
      title: 'Leaky faucet',
      description: 'Drips overnight',
      propertyId: 'unit-101',
      priority: 'high',
      status: 'open',
    });
    // createdBy is populated on the response.
    expect(res.body.data.request.createdBy).toMatchObject({
      _id: user._id.toString(),
      email: 'tenant@x.com',
      role: 'tenant',
    });

    // Persisted with exactly the same fields.
    const stored = await MaintenanceRequestModel.findById(
      res.body.data.request._id
    );
    expect(stored).not.toBeNull();
    expect(stored!.status).toBe(MaintenanceStatus.OPEN);
    expect(stored!.createdBy.toString()).toBe(user._id.toString());
  });

  it('returns 400 on missing required fields', async () => {
    const { token } = await seedUser({ email: 't@x.com', role: 'tenant' });

    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'x' }); // too short, no description, no propertyId

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(
      expect.arrayContaining(['title', 'description', 'propertyId'])
    );
  });

  it('returns 401 with no token', async () => {
    const res = await request(app)
      .post('/api/maintenance')
      .send({ title: 'x', description: 'y', propertyId: 'z' });
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({ title: 'Title here', description: 'Desc', propertyId: 'p1' });
    expect(res.status).toBe(401);
  });

  it.each([
    ['manager' as const],
    ['admin' as const],
  ])('rejects %s creates with 403 and persists nothing', async (role) => {
    const { token } = await seedUser({ email: `${role}@x.com`, role });

    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Manager-filed',
        description: 'should not be allowed',
        propertyId: 'unit-101',
      });

    expect(res.status).toBe(403);
    const count = await MaintenanceRequestModel.countDocuments({});
    expect(count).toBe(0);
  });
});

describe('GET /api/maintenance', () => {
  it('scopes a tenant to their own requests only', async () => {
    const { user: tenantA, token: tokenA } = await seedUser({
      email: 'a@x.com',
      role: 'tenant',
    });
    const { user: tenantB } = await seedUser({
      email: 'b@x.com',
      role: 'tenant',
    });

    await MaintenanceRequestModel.create([
      {
        title: 'A11',
        description: 'd',
        propertyId: 'p',
        createdBy: tenantA._id,
        status: MaintenanceStatus.OPEN,
      },
      {
        title: 'A22',
        description: 'd',
        propertyId: 'p',
        createdBy: tenantA._id,
        status: MaintenanceStatus.OPEN,
      },
      {
        title: 'B11',
        description: 'd',
        propertyId: 'p',
        createdBy: tenantB._id,
        status: MaintenanceStatus.OPEN,
      },
    ]);

    const res = await request(app)
      .get('/api/maintenance')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    const titles = res.body.data.items.map((i: { title: string }) => i.title);
    expect(titles.sort()).toEqual(['A11', 'A22']);
    expect(res.body.data.pagination).toMatchObject({
      page: 1,
      total: 2,
      totalPages: 1,
    });
  });

  it('lets a manager see all requests and filter by status', async () => {
    const { user: tenant } = await seedUser({
      email: 't@x.com',
      role: 'tenant',
    });
    const { token: managerToken } = await seedUser({
      email: 'm@x.com',
      role: 'manager',
    });

    await MaintenanceRequestModel.create([
      {
        title: 'Open one',
        description: 'd',
        propertyId: 'p',
        createdBy: tenant._id,
        status: MaintenanceStatus.OPEN,
      },
      {
        title: 'In progress one',
        description: 'd',
        propertyId: 'p',
        createdBy: tenant._id,
        status: MaintenanceStatus.IN_PROGRESS,
      },
    ]);

    const all = await request(app)
      .get('/api/maintenance')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(all.body.data.items).toHaveLength(2);

    const filtered = await request(app)
      .get('/api/maintenance')
      .query({ status: 'in-progress' })
      .set('Authorization', `Bearer ${managerToken}`);
    expect(filtered.body.data.items).toHaveLength(1);
    expect(filtered.body.data.items[0].title).toBe('In progress one');
  });

  it('lets a manager filter by priority', async () => {
    const { user: tenant } = await seedUser({
      email: 't@x.com',
      role: 'tenant',
    });
    const { token: managerToken } = await seedUser({
      email: 'm@x.com',
      role: 'manager',
    });

    await MaintenanceRequestModel.create([
      {
        title: 'High',
        description: 'd',
        propertyId: 'p',
        createdBy: tenant._id,
        status: MaintenanceStatus.OPEN,
        priority: MaintenancePriority.HIGH,
      },
      {
        title: 'Normal',
        description: 'd',
        propertyId: 'p',
        createdBy: tenant._id,
        status: MaintenanceStatus.OPEN,
        priority: MaintenancePriority.NORMAL,
      },
    ]);

    const res = await request(app)
      .get('/api/maintenance')
      .query({ priority: 'high' })
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].title).toBe('High');
    expect(res.body.data.items[0].priority).toBe('high');
  });
});

describe('GET /api/maintenance/:id', () => {
  it('returns 403 when a tenant tries to read another tenant’s request', async () => {
    const { user: ownerTenant } = await seedUser({
      email: 'owner@x.com',
      role: 'tenant',
    });
    const { token: otherToken } = await seedUser({
      email: 'other@x.com',
      role: 'tenant',
    });

    const req = await MaintenanceRequestModel.create({
      title: 'Req',
      description: 'd',
      propertyId: 'p',
      createdBy: ownerTenant._id,
      status: MaintenanceStatus.OPEN,
    });

    const res = await request(app)
      .get(`/api/maintenance/${req._id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 when the id is well-formed but missing', async () => {
    const { token } = await seedUser({ email: 'm@x.com', role: 'manager' });
    const res = await request(app)
      .get(`/api/maintenance/${new Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('returns 400 when the id is malformed', async () => {
    const { token } = await seedUser({ email: 'm@x.com', role: 'manager' });
    const res = await request(app)
      .get('/api/maintenance/not-an-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/maintenance/:id', () => {
  it('rejects tenant updates with 403', async () => {
    const { user: tenant, token: tenantToken } = await seedUser({
      email: 't@x.com',
      role: 'tenant',
    });
    const req = await MaintenanceRequestModel.create({
      title: 'Req',
      description: 'd',
      propertyId: 'p',
      createdBy: tenant._id,
      status: MaintenanceStatus.OPEN,
    });

    const res = await request(app)
      .patch(`/api/maintenance/${req._id}`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ status: 'in-progress' });

    expect(res.status).toBe(403);
    const stored = await MaintenanceRequestModel.findById(req._id);
    expect(stored!.status).toBe(MaintenanceStatus.OPEN);
  });

  it('walks a request through open → in-progress → completed and stamps completedAt', async () => {
    const { user: tenant } = await seedUser({
      email: 't@x.com',
      role: 'tenant',
    });
    const { token } = await seedUser({ email: 'm@x.com', role: 'manager' });
    const req = await MaintenanceRequestModel.create({
      title: 'Req',
      description: 'd',
      propertyId: 'p',
      createdBy: tenant._id,
      status: MaintenanceStatus.OPEN,
    });

    const r1 = await request(app)
      .patch(`/api/maintenance/${req._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in-progress' });
    expect(r1.status).toBe(200);
    expect(r1.body.data.request.status).toBe('in-progress');
    expect(r1.body.data.request.completedAt).toBeUndefined();

    const r2 = await request(app)
      .patch(`/api/maintenance/${req._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' });
    expect(r2.status).toBe(200);
    expect(r2.body.data.request.status).toBe('completed');
    expect(r2.body.data.request.completedAt).toBeDefined();

    const stored = await MaintenanceRequestModel.findById(req._id);
    expect(stored!.status).toBe(MaintenanceStatus.COMPLETED);
    expect(stored!.completedAt).toBeInstanceOf(Date);
  });

  it('rejects an illegal transition (completed → open) with 400', async () => {
    const { user: tenant } = await seedUser({
      email: 't@x.com',
      role: 'tenant',
    });
    const { token } = await seedUser({ email: 'm@x.com', role: 'manager' });
    const req = await MaintenanceRequestModel.create({
      title: 'Req',
      description: 'd',
      propertyId: 'p',
      createdBy: tenant._id,
      status: MaintenanceStatus.COMPLETED,
    });

    const res = await request(app)
      .patch(`/api/maintenance/${req._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'open' });

    expect(res.status).toBe(400);
    const stored = await MaintenanceRequestModel.findById(req._id);
    expect(stored!.status).toBe(MaintenanceStatus.COMPLETED);
  });

  it('allows assignment to a manager and persists it on a subsequent GET', async () => {
    const { user: tenant } = await seedUser({
      email: 't@x.com',
      role: 'tenant',
    });
    const { user: manager, token } = await seedUser({
      email: 'm@x.com',
      role: 'manager',
    });
    const req = await MaintenanceRequestModel.create({
      title: 'Req',
      description: 'd',
      propertyId: 'p',
      createdBy: tenant._id,
      status: MaintenanceStatus.OPEN,
    });

    const patch = await request(app)
      .patch(`/api/maintenance/${req._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assignedTo: manager._id.toString() });
    expect(patch.status).toBe(200);
    expect(patch.body.data.request.assignedTo).toMatchObject({
      _id: manager._id.toString(),
      role: 'manager',
    });

    const fetched = await request(app)
      .get(`/api/maintenance/${req._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(fetched.body.data.request.assignedTo).toMatchObject({
      _id: manager._id.toString(),
    });
  });

  it('rejects assignment to a tenant (non-manager) with 400', async () => {
    const { user: tenant } = await seedUser({
      email: 't@x.com',
      role: 'tenant',
    });
    const { token } = await seedUser({ email: 'm@x.com', role: 'manager' });
    const req = await MaintenanceRequestModel.create({
      title: 'Req',
      description: 'd',
      propertyId: 'p',
      createdBy: tenant._id,
      status: MaintenanceStatus.OPEN,
    });

    const res = await request(app)
      .patch(`/api/maintenance/${req._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assignedTo: tenant._id.toString() });

    expect(res.status).toBe(400);
    const stored = await MaintenanceRequestModel.findById(req._id);
    expect(stored!.assignedTo).toBeUndefined();
  });
});

describe('DELETE /api/maintenance/:id', () => {
  it('rejects tenant deletes with 403 and leaves the record in place', async () => {
    const { user: tenant, token: tenantToken } = await seedUser({
      email: 't@x.com',
      role: 'tenant',
    });
    const req = await MaintenanceRequestModel.create({
      title: 'Req',
      description: 'd',
      propertyId: 'p',
      createdBy: tenant._id,
      status: MaintenanceStatus.OPEN,
    });

    const res = await request(app)
      .delete(`/api/maintenance/${req._id}`)
      .set('Authorization', `Bearer ${tenantToken}`);

    expect(res.status).toBe(403);
    const stored = await MaintenanceRequestModel.findById(req._id);
    expect(stored).not.toBeNull();
  });

  it('lets a manager delete and returns 204', async () => {
    const { user: tenant } = await seedUser({
      email: 't@x.com',
      role: 'tenant',
    });
    const { token } = await seedUser({ email: 'm@x.com', role: 'manager' });
    const req = await MaintenanceRequestModel.create({
      title: 'Req',
      description: 'd',
      propertyId: 'p',
      createdBy: tenant._id,
      status: MaintenanceStatus.OPEN,
    });

    const res = await request(app)
      .delete(`/api/maintenance/${req._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    const stored = await MaintenanceRequestModel.findById(req._id);
    expect(stored).toBeNull();
  });
});
