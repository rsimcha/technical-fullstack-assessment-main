import { UserModel } from '../models/User';

type UserRole = 'admin' | 'manager' | 'tenant';

export class UserService {
  async listUsers(filter: { role?: UserRole } = {}) {
    const query = filter.role ? { role: filter.role } : {};
    return UserModel.find(query)
      .select('firstName lastName email')
      .sort({ firstName: 1, lastName: 1 });
  }
}

export const userService = new UserService();
