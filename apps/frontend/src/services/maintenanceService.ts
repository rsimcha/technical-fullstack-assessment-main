import api, { handleApiResponse, handleApiError } from './api';
import {
  CreateMaintenanceFormData,
  MaintenanceListFilters,
  MaintenanceListResponse,
  MaintenanceRequest,
  UpdateMaintenanceFormData,
} from '../types';

export const maintenanceService = {
  async list(
    filters: MaintenanceListFilters = {}
  ): Promise<MaintenanceListResponse> {
    try {
      const params: Record<string, string | number> = {};
      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.priority) {
        params.priority = filters.priority;
      }
      if (filters.assignedTo) {
        params.assignedTo = filters.assignedTo;
      }
      if (filters.page) {
        params.page = filters.page;
      }
      if (filters.limit) {
        params.limit = filters.limit;
      }

      const response = await api.get('/maintenance', { params });
      return handleApiResponse<MaintenanceListResponse>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getById(id: string): Promise<{ request: MaintenanceRequest }> {
    try {
      const response = await api.get(`/maintenance/${id}`);
      return handleApiResponse<{ request: MaintenanceRequest }>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(
    input: CreateMaintenanceFormData
  ): Promise<{ request: MaintenanceRequest }> {
    try {
      const response = await api.post('/maintenance', input);
      return handleApiResponse<{ request: MaintenanceRequest }>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async update(
    id: string,
    patch: UpdateMaintenanceFormData
  ): Promise<{ request: MaintenanceRequest }> {
    try {
      const response = await api.patch(`/maintenance/${id}`, patch);
      return handleApiResponse<{ request: MaintenanceRequest }>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await api.delete(`/maintenance/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};
