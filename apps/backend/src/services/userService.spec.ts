import { beforeEach, describe, expect, it, vi, Mock } from 'vitest';

vi.mock('../models/User', () => ({
  UserModel: {
    find: vi.fn(),
  },
}));

import { UserModel } from '../models/User';
import { userService } from './userService';

type MockedUserModel = {
  find: Mock;
};

const userModel = UserModel as unknown as MockedUserModel;

const chainableFind = (final: unknown) => {
  const query = {
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockResolvedValue(final),
  };
  return query;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('userService.listUsers', () => {
  it('filters users by role, selects public fields, and sorts by name', async () => {
    const managers = [
      {
        _id: 'manager-1',
        firstName: 'Amy',
        lastName: 'Zimmer',
        email: 'amy.manager@x.com',
      },
    ];
    const query = chainableFind(managers);
    userModel.find.mockReturnValue(query);

    const result = await userService.listUsers({ role: 'manager' });

    expect(userModel.find).toHaveBeenCalledWith({ role: 'manager' });
    expect(query.select).toHaveBeenCalledWith('firstName lastName email');
    expect(query.sort).toHaveBeenCalledWith({ firstName: 1, lastName: 1 });
    expect(result).toBe(managers);
  });

  it('lists all users when no role filter is provided', async () => {
    const users = [
      {
        _id: 'admin-1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@x.com',
      },
      {
        _id: 'tenant-1',
        firstName: 'Tenant',
        lastName: 'User',
        email: 'tenant@x.com',
      },
    ];
    const query = chainableFind(users);
    userModel.find.mockReturnValue(query);

    const result = await userService.listUsers();

    expect(userModel.find).toHaveBeenCalledWith({});
    expect(query.select).toHaveBeenCalledWith('firstName lastName email');
    expect(query.sort).toHaveBeenCalledWith({ firstName: 1, lastName: 1 });
    expect(result).toBe(users);
  });
});
