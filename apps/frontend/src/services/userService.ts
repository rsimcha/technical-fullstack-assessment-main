import api, { handleApiResponse, handleApiError } from './api';
import { Manager } from '../types';

export const userService = {
  async listByRole(role: string): Promise<{ users: Manager[] }> {
    try {
      const response = await api.get('/users', { params: { role } });
      return handleApiResponse<{ users: Manager[] }>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
};
