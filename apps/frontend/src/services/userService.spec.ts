import { describe, expect, it, vi, Mock } from 'vitest';
import api from './api';
import { userService } from './userService';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
  },
  handleApiResponse: vi.fn(response => response.data.data),
  handleApiError: vi.fn(error => {
    throw error;
  }),
}));

const apiMock = api as unknown as {
  get: Mock;
};

describe('frontend userService', () => {
  it('requests users with the requested role as a query param', async () => {
    const users = [
      {
        _id: 'manager-1',
        firstName: 'Amy',
        lastName: 'Zimmer',
        email: 'amy.manager@x.com',
      },
    ];
    apiMock.get.mockResolvedValue({
      data: { success: true, data: { users } },
    });

    const result = await userService.listByRole('manager');

    expect(apiMock.get).toHaveBeenCalledWith('/users', {
      params: { role: 'manager' },
    });
    expect(result).toEqual({ users });
  });
});
