import { describe, expect, it, vi, Mock } from 'vitest';
import api from './api';
import { maintenanceService } from './maintenanceService';
import { MaintenancePriority, MaintenanceStatus } from '../types';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  handleApiResponse: vi.fn(response => response.data.data),
  handleApiError: vi.fn(error => {
    throw error;
  }),
}));

const apiMock = api as unknown as {
  get: Mock;
  post: Mock;
  patch: Mock;
  delete: Mock;
};

describe('frontend maintenanceService', () => {
  it('builds list query params from supported filters only', async () => {
    const response = {
      items: [],
      pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
    };
    apiMock.get.mockResolvedValue({
      data: { success: true, data: response },
    });

    const result = await maintenanceService.list({
      status: MaintenanceStatus.OPEN,
      priority: MaintenancePriority.HIGH,
      assignedTo: 'manager-1',
      page: 2,
      limit: 10,
    });

    expect(apiMock.get).toHaveBeenCalledWith('/maintenance', {
      params: {
        status: 'open',
        priority: 'high',
        assignedTo: 'manager-1',
        page: 2,
        limit: 10,
      },
    });
    expect(result).toBe(response);
  });

  it('creates, updates, and deletes through the expected endpoints', async () => {
    apiMock.post.mockResolvedValue({
      data: { success: true, data: { request: { _id: 'request-1' } } },
    });
    apiMock.patch.mockResolvedValue({
      data: { success: true, data: { request: { _id: 'request-1' } } },
    });
    apiMock.delete.mockResolvedValue({ data: {} });

    await maintenanceService.create({
      title: 'Leaky faucet',
      description: 'Drips overnight',
      propertyId: 'unit-101',
      priority: MaintenancePriority.NORMAL,
    });
    await maintenanceService.update('request-1', {
      status: MaintenanceStatus.IN_PROGRESS,
      assignedTo: 'manager-1',
    });
    await maintenanceService.remove('request-1');

    expect(apiMock.post).toHaveBeenCalledWith('/maintenance', {
      title: 'Leaky faucet',
      description: 'Drips overnight',
      propertyId: 'unit-101',
      priority: 'normal',
    });
    expect(apiMock.patch).toHaveBeenCalledWith('/maintenance/request-1', {
      status: 'in-progress',
      assignedTo: 'manager-1',
    });
    expect(apiMock.delete).toHaveBeenCalledWith('/maintenance/request-1');
  });
});
