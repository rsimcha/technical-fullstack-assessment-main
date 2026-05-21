import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { userService } from '../services/userService';
import { ListUsersQuery } from '../validators/userSchemas';

export const listUsers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { role } = req.query as ListUsersQuery;
    const users = await userService.listUsers({ role });

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: { users },
    });
  }
);
