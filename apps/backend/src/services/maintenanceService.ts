import { FilterQuery, PopulateOptions, Types } from 'mongoose';
import {
  MaintenanceRequest,
  MaintenanceRequestModel,
  MaintenanceStatus,
} from '../models/MaintenanceRequest';
import { UserModel } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { assertTransition } from '../utils/maintenance/status';
import {
  CreateMaintenanceRequestInput,
  ListMaintenanceQuery,
  UpdateMaintenanceRequestInput,
} from '../utils/validation';
import { logger } from '../utils/logger';

interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'tenant';
}

const populateUsers: PopulateOptions[] = [
  { path: 'createdBy', select: 'firstName lastName email role' },
  { path: 'assignedTo', select: 'firstName lastName email role' },
];

export class MaintenanceService {
  async create(input: CreateMaintenanceRequestInput, actor: AuthenticatedUser) {
    if (actor.role !== 'tenant') {
      throw createError('Forbidden', 403);
    }

    const request = await MaintenanceRequestModel.create({
      ...input,
      createdBy: new Types.ObjectId(actor.id),
      status: MaintenanceStatus.OPEN,
    });

    logger.info(
      `Maintenance request created by ${actor.email}: ${request._id}`
    );

    return request.populate(populateUsers);
  }

  async list(query: ListMaintenanceQuery, actor: AuthenticatedUser) {
    const filter: FilterQuery<MaintenanceRequest> = {};

    // Role scoping: tenants can only see their own requests
    if (actor.role === 'tenant') {
      filter.createdBy = new Types.ObjectId(actor.id);
    }

    // Query filters
    if (query.status) {
      filter.status = query.status;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.assignedTo && actor.role !== 'tenant') {
      filter.assignedTo = new Types.ObjectId(query.assignedTo);
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      MaintenanceRequestModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .populate(populateUsers),
      MaintenanceRequestModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getById(id: string, actor: AuthenticatedUser) {
    const request = await MaintenanceRequestModel.findById(id);
    if (!request) {
      throw createError('Maintenance request not found', 404);
    }

    if (actor.role === 'tenant' && request.createdBy.toString() !== actor.id) {
      throw createError('Forbidden', 403);
    }

    return request.populate(populateUsers);
  }

  async update(
    id: string,
    patch: UpdateMaintenanceRequestInput,
    actor: AuthenticatedUser
  ) {
    if (actor.role !== 'manager' && actor.role !== 'admin') {
      throw createError('Forbidden', 403);
    }

    const request = await MaintenanceRequestModel.findById(id);
    if (!request) {
      throw createError('Maintenance request not found', 404);
    }

    if (patch.status && patch.status !== request.status) {
      assertTransition(request.status, patch.status);
      request.status = patch.status;
      if (patch.status === MaintenanceStatus.COMPLETED) {
        request.completedAt = new Date();
      }
    }

    if (patch.title !== undefined) {
      request.title = patch.title;
    }
    if (patch.description !== undefined) {
      request.description = patch.description;
    }
    if (patch.priority !== undefined) {
      request.priority = patch.priority;
    }

    if (patch.assignedTo === null) {
      request.assignedTo = undefined;
    } else if (patch.assignedTo) {
      const assignee = await UserModel.findById(patch.assignedTo).select('role');
      if (!assignee) {
        throw createError('Assignee not found', 400);
      }
      if (assignee.role !== 'manager') {
        throw createError(
          'Requests can only be assigned to managers',
          400
        );
      }
      request.assignedTo = new Types.ObjectId(patch.assignedTo);
    }

    await request.save();

    logger.info(`Maintenance request ${request._id} updated by ${actor.email}`);

    return request.populate(populateUsers);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    if (actor.role !== 'manager' && actor.role !== 'admin') {
      throw createError('Forbidden', 403);
    }

    const request = await MaintenanceRequestModel.findByIdAndDelete(id);
    if (!request) {
      throw createError('Maintenance request not found', 404);
    }

    logger.info(`Maintenance request ${id} deleted by ${actor.email}`);
  }
}

export const maintenanceService = new MaintenanceService();
