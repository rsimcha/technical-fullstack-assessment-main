import { beforeEach, describe, expect, it, vi, Mock } from 'vitest';
import { FilterQuery, Types } from 'mongoose';

vi.mock('../models/MaintenanceRequest', () => {
  const MaintenanceStatus = {
    OPEN: 'open',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  } as const;
  const MaintenancePriority = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
  } as const;
  return {
    MaintenanceStatus,
    MaintenancePriority,
    MaintenanceRequestModel: {
      create: vi.fn(),
      find: vi.fn(),
      findById: vi.fn(),
      findByIdAndDelete: vi.fn(),
      countDocuments: vi.fn(),
    },
  };
});

vi.mock('../models/User', () => ({
  UserModel: {
    findById: vi.fn(),
  },
}));

vi.mock('../utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  MaintenancePriority,
  MaintenanceRequestModel,
  MaintenanceStatus,
} from '../models/MaintenanceRequest';
import { UserModel } from '../models/User';
import { maintenanceService } from './maintenanceService';
import { ListMaintenanceQuery } from '../utils/validation';

const tenantId = new Types.ObjectId().toString();
const managerId = new Types.ObjectId().toString();
const otherManagerId = new Types.ObjectId().toString();

const tenant = { id: tenantId, email: 't@x.com', role: 'tenant' as const };
const manager = { id: managerId, email: 'm@x.com', role: 'manager' as const };

type MockedMaintenanceModel = {
  create: Mock;
  find: Mock;
  findById: Mock;
  findByIdAndDelete: Mock;
  countDocuments: Mock;
};

type MockedUserModel = {
  findById: Mock;
};

interface TestMaintenanceDoc {
  _id: Types.ObjectId;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  propertyId: string;
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  completedAt?: Date;
  save: Mock;
  populate: Mock;
}

const maintenanceModel =
  MaintenanceRequestModel as unknown as MockedMaintenanceModel;
const userModel = UserModel as unknown as MockedUserModel;

const makeDoc = (
  overrides: Partial<TestMaintenanceDoc> = {}
): TestMaintenanceDoc => {
  const doc = {
    _id: new Types.ObjectId(),
    title: 'Leaky faucet',
    description: 'Drips overnight',
    status: MaintenanceStatus.OPEN,
    priority: MaintenancePriority.NORMAL,
    propertyId: 'unit-101',
    createdBy: new Types.ObjectId(tenantId),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as TestMaintenanceDoc;
  // populate resolves with the same doc (and is observable)
  doc.populate = vi.fn().mockResolvedValue(doc);
  return doc;
};

const chainable = (final: unknown) => ({
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  populate: vi.fn().mockResolvedValue(final),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('maintenanceService.create', () => {
  it.each([
    ['manager' as const, manager],
    ['admin' as const, { id: 'a', email: 'a@x.com', role: 'admin' as const }],
  ])(
    'throws 403 when called by %s and never touches the model',
    async (_role, actor) => {
      await expect(
        maintenanceService.create(
          {
            title: 'Manager-filed',
            description: 'd',
            propertyId: 'p',
            priority: MaintenancePriority.LOW,
          },
          actor
        )
      ).rejects.toMatchObject({ statusCode: 403 });
      expect(maintenanceModel.create).not.toHaveBeenCalled();
    }
  );

  it('persists the input verbatim, stamps createdBy and status=open, and returns the populated doc', async () => {
    const created = makeDoc({ title: 'Leaky faucet' });
    maintenanceModel.create.mockResolvedValue(created);

    const result = await maintenanceService.create(
      {
        title: 'Leaky faucet',
        description: 'Drips overnight',
        propertyId: 'unit-101',
        priority: MaintenancePriority.HIGH,
      },
      tenant
    );

    // Exactly one create call, with the right payload shape.
    expect(maintenanceModel.create).toHaveBeenCalledTimes(1);
    const payload = maintenanceModel.create.mock.calls[0][0];
    expect(payload).toMatchObject({
      title: 'Leaky faucet',
      description: 'Drips overnight',
      propertyId: 'unit-101',
      priority: MaintenancePriority.HIGH,
      status: MaintenanceStatus.OPEN,
    });
    // createdBy is an ObjectId built from the actor id.
    expect(payload.createdBy).toBeInstanceOf(Types.ObjectId);
    expect(payload.createdBy.toString()).toBe(tenantId);
    // Callers don't get to pick status.
    expect(payload.status).toBe(MaintenanceStatus.OPEN);

    // The returned value is the populated doc.
    expect(created.populate).toHaveBeenCalledTimes(1);
    expect(result).toBe(created);
  });
});

describe('maintenanceService.list', () => {
  it('returns the populated items with correct pagination metadata', async () => {
    const item1 = makeDoc({ title: 'A' });
    const item2 = makeDoc({ title: 'B' });
    const chain = chainable([item1, item2]);
    maintenanceModel.find.mockReturnValue(chain);
    maintenanceModel.countDocuments.mockResolvedValue(42);

    const result = await maintenanceService.list(
      { page: 2, limit: 10 } as ListMaintenanceQuery,
      manager
    );

    // Sorting newest-first, paging by (page-1)*limit, capping by limit.
    expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(chain.skip).toHaveBeenCalledWith(10);
    expect(chain.limit).toHaveBeenCalledWith(10);

    // The returned shape is exactly the contract the controller forwards.
    expect(result.items).toEqual([item1, item2]);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 42,
      totalPages: 5,
    });
  });

  it('scopes by createdBy when the actor is a tenant', async () => {
    maintenanceModel.find.mockReturnValue(chainable([]));
    maintenanceModel.countDocuments.mockResolvedValue(0);

    await maintenanceService.list(
      { page: 1, limit: 10 } as ListMaintenanceQuery,
      tenant
    );

    const filter = maintenanceModel.find.mock.calls[0][0] as FilterQuery<{
      createdBy: Types.ObjectId;
    }>;
    expect(filter.createdBy).toBeInstanceOf(Types.ObjectId);
    expect(filter.createdBy.toString()).toBe(tenantId);
    // The same filter was used for the count, so total can't leak across users.
    expect(maintenanceModel.countDocuments).toHaveBeenCalledWith(filter);
  });

  it('does not scope by createdBy when actor is a manager, and forwards status/priority/assignedTo', async () => {
    maintenanceModel.find.mockReturnValue(chainable([]));
    maintenanceModel.countDocuments.mockResolvedValue(0);

    await maintenanceService.list(
      {
        page: 1,
        limit: 10,
        status: MaintenanceStatus.OPEN,
        priority: MaintenancePriority.HIGH,
        assignedTo: otherManagerId,
      } as ListMaintenanceQuery,
      manager
    );

    const filter = maintenanceModel.find.mock.calls[0][0] as FilterQuery<{
      assignedTo: Types.ObjectId;
      priority: MaintenancePriority;
      status: MaintenanceStatus;
    }>;
    expect(filter).not.toHaveProperty('createdBy');
    expect(filter.status).toBe(MaintenanceStatus.OPEN);
    expect(filter.priority).toBe(MaintenancePriority.HIGH);
    expect(filter.assignedTo).toBeInstanceOf(Types.ObjectId);
    expect(filter.assignedTo.toString()).toBe(otherManagerId);
  });

  it('ignores assignedTo filter when the actor is a tenant', async () => {
    maintenanceModel.find.mockReturnValue(chainable([]));
    maintenanceModel.countDocuments.mockResolvedValue(0);

    await maintenanceService.list(
      {
        page: 1,
        limit: 10,
        assignedTo: otherManagerId,
      } as ListMaintenanceQuery,
      tenant
    );

    const filter = maintenanceModel.find.mock.calls[0][0] as FilterQuery<{
      createdBy: Types.ObjectId;
    }>;
    expect(filter).not.toHaveProperty('assignedTo');
    expect(filter.createdBy.toString()).toBe(tenantId);
  });
});

describe('maintenanceService.getById', () => {
  it('throws 404 when not found', async () => {
    maintenanceModel.findById.mockResolvedValue(null);
    await expect(
      maintenanceService.getById('missing-id', manager)
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(MaintenanceRequestModel.findById).toHaveBeenCalledWith('missing-id');
  });

  it('throws 403 when a tenant requests another user’s record', async () => {
    const otherCreatorId = new Types.ObjectId();
    const doc = makeDoc({ createdBy: otherCreatorId });
    maintenanceModel.findById.mockResolvedValue(doc);

    await expect(
      maintenanceService.getById('id', tenant)
    ).rejects.toMatchObject({ statusCode: 403 });
    // Never expose the doc, even via populate.
    expect(doc.populate).not.toHaveBeenCalled();
  });

  it('returns the populated doc when a tenant requests their own record', async () => {
    const doc = makeDoc({ createdBy: new Types.ObjectId(tenantId) });
    maintenanceModel.findById.mockResolvedValue(doc);

    const result = await maintenanceService.getById('id', tenant);

    expect(doc.populate).toHaveBeenCalledTimes(1);
    expect(result).toBe(doc);
  });
});

describe('maintenanceService.update', () => {
  it('throws 403 when called by a tenant and never touches the model', async () => {
    await expect(
      maintenanceService.update(
        'any-id',
        { status: MaintenanceStatus.IN_PROGRESS },
        tenant
      )
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(MaintenanceRequestModel.findById).not.toHaveBeenCalled();
  });

  it('throws 404 when the request does not exist', async () => {
    maintenanceModel.findById.mockResolvedValue(null);
    await expect(
      maintenanceService.update(
        'id',
        { status: MaintenanceStatus.IN_PROGRESS },
        manager
      )
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('applies a legal status transition (open → in-progress) and leaves other fields untouched', async () => {
    const doc = makeDoc({
      status: MaintenanceStatus.OPEN,
      priority: MaintenancePriority.NORMAL,
    });
    maintenanceModel.findById.mockResolvedValue(doc);

    const result = await maintenanceService.update(
      'id',
      { status: MaintenanceStatus.IN_PROGRESS },
      manager
    );

    expect(doc.status).toBe(MaintenanceStatus.IN_PROGRESS);
    expect(doc.completedAt).toBeUndefined();
    // Unrelated fields untouched.
    expect(doc.priority).toBe(MaintenancePriority.NORMAL);
    expect(doc.title).toBe('Leaky faucet');
    expect(doc.save).toHaveBeenCalledTimes(1);
    expect(doc.populate).toHaveBeenCalledTimes(1);
    expect(result).toBe(doc);
  });

  it('rejects an illegal status transition (completed → open) without saving', async () => {
    const doc = makeDoc({ status: MaintenanceStatus.COMPLETED });
    maintenanceModel.findById.mockResolvedValue(doc);

    await expect(
      maintenanceService.update(
        'id',
        { status: MaintenanceStatus.OPEN },
        manager
      )
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(doc.status).toBe(MaintenanceStatus.COMPLETED);
    expect(doc.save).not.toHaveBeenCalled();
  });

  it('stamps completedAt when transitioning to completed', async () => {
    const before = Date.now();
    const doc = makeDoc({ status: MaintenanceStatus.IN_PROGRESS });
    maintenanceModel.findById.mockResolvedValue(doc);

    await maintenanceService.update(
      'id',
      { status: MaintenanceStatus.COMPLETED },
      manager
    );

    expect(doc.status).toBe(MaintenanceStatus.COMPLETED);
    expect(doc.completedAt).toBeInstanceOf(Date);
    expect((doc.completedAt as Date).getTime()).toBeGreaterThanOrEqual(before);
  });

  it('patches title/description/priority verbatim', async () => {
    const doc = makeDoc({
      title: 'old',
      description: 'old',
      priority: MaintenancePriority.NORMAL,
    });
    maintenanceModel.findById.mockResolvedValue(doc);

    await maintenanceService.update(
      'id',
      {
        title: 'new',
        description: 'new desc',
        priority: MaintenancePriority.URGENT,
      },
      manager
    );

    expect(doc.title).toBe('new');
    expect(doc.description).toBe('new desc');
    expect(doc.priority).toBe(MaintenancePriority.URGENT);
    expect(doc.save).toHaveBeenCalledTimes(1);
  });

  it('clears the assignment when assignedTo is null (and does not look up a user)', async () => {
    const doc = makeDoc({ assignedTo: new Types.ObjectId(managerId) });
    maintenanceModel.findById.mockResolvedValue(doc);

    await maintenanceService.update('id', { assignedTo: null }, manager);

    expect(doc.assignedTo).toBeUndefined();
    expect(userModel.findById).not.toHaveBeenCalled();
    expect(doc.save).toHaveBeenCalledTimes(1);
  });

  it('rejects assignment to a non-existent user with a 400 and does not save', async () => {
    const doc = makeDoc();
    maintenanceModel.findById.mockResolvedValue(doc);
    const selectFn = vi.fn().mockResolvedValue(null);
    userModel.findById.mockReturnValue({ select: selectFn });

    await expect(
      maintenanceService.update('id', { assignedTo: otherManagerId }, manager)
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(userModel.findById).toHaveBeenCalledWith(otherManagerId);
    expect(selectFn).toHaveBeenCalledWith('role');
    expect(doc.save).not.toHaveBeenCalled();
  });

  it('rejects assignment to a non-manager (tenant) with a 400 and does not mutate or save', async () => {
    const originalAssignee = new Types.ObjectId(managerId);
    const doc = makeDoc({ assignedTo: originalAssignee });
    maintenanceModel.findById.mockResolvedValue(doc);
    userModel.findById.mockReturnValue({
      select: vi.fn().mockResolvedValue({ role: 'tenant' }),
    });

    await expect(
      maintenanceService.update('id', { assignedTo: tenantId }, manager)
    ).rejects.toMatchObject({ statusCode: 400 });

    // Original assignment is preserved.
    expect(doc.assignedTo).toBe(originalAssignee);
    expect(doc.save).not.toHaveBeenCalled();
  });

  it('accepts assignment to a manager and persists the new ObjectId', async () => {
    const doc = makeDoc({ assignedTo: undefined });
    maintenanceModel.findById.mockResolvedValue(doc);
    userModel.findById.mockReturnValue({
      select: vi.fn().mockResolvedValue({ role: 'manager' }),
    });

    await maintenanceService.update(
      'id',
      { assignedTo: otherManagerId },
      manager
    );

    expect(doc.assignedTo).toBeInstanceOf(Types.ObjectId);
    expect(doc.assignedTo?.toString()).toBe(otherManagerId);
    expect(doc.save).toHaveBeenCalledTimes(1);
  });
});

describe('maintenanceService.remove', () => {
  it('throws 403 when called by a tenant and never touches the model', async () => {
    await expect(
      maintenanceService.remove('any-id', tenant)
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(maintenanceModel.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('throws 404 when the request does not exist', async () => {
    maintenanceModel.findByIdAndDelete.mockResolvedValue(null);
    await expect(
      maintenanceService.remove('missing-id', manager)
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(maintenanceModel.findByIdAndDelete).toHaveBeenCalledWith(
      'missing-id'
    );
  });

  it('resolves to undefined when the request was deleted', async () => {
    const deleted = makeDoc();
    maintenanceModel.findByIdAndDelete.mockResolvedValue(deleted);

    await expect(
      maintenanceService.remove('id', manager)
    ).resolves.toBeUndefined();
    expect(maintenanceModel.findByIdAndDelete).toHaveBeenCalledWith('id');
  });
});
