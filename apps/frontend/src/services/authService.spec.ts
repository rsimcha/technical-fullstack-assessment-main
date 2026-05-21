import { describe, expect, it } from 'vitest';
import { authService } from './authService';
import { User } from '../types';

const user: User = {
  _id: 'user-1',
  email: 'tenant@x.com',
  firstName: 'Test',
  lastName: 'Tenant',
  role: 'tenant',
  isEmailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('frontend authService storage helpers', () => {
  it('stores and retrieves auth token and user', () => {
    authService.setToken('token-1');
    authService.setUser(user);

    expect(authService.getToken()).toBe('token-1');
    expect(authService.getUser()).toEqual(user);
  });

  it('clears token and user on logout', () => {
    authService.setToken('token-1');
    authService.setUser(user);

    authService.logout();

    expect(authService.getToken()).toBeNull();
    expect(authService.getUser()).toBeNull();
  });
});
