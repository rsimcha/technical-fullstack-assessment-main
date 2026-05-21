import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { maintenanceService } from '../services/maintenanceService';
import { listMaintenanceQuerySchema } from '../validators/maintenanceSchemas';

export const createRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const request = await maintenanceService.create(req.body, req.user!);

    res.status(201).json({
      success: true,
      message: 'Maintenance request created successfully',
      data: { request },
    });
  }
);

export const listRequests = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const query = listMaintenanceQuerySchema.parse(req.query);
    const result = await maintenanceService.list(query, req.user!);

    res.status(200).json({
      success: true,
      message: 'Maintenance requests retrieved successfully',
      data: result,
    });
  }
);

export const getRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const request = await maintenanceService.getById(req.params.id, req.user!);

    res.status(200).json({
      success: true,
      message: 'Maintenance request retrieved successfully',
      data: { request },
    });
  }
);

export const updateRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const request = await maintenanceService.update(
      req.params.id,
      req.body,
      req.user!
    );

    res.status(200).json({
      success: true,
      message: 'Maintenance request updated successfully',
      data: { request },
    });
  }
);

export const deleteRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await maintenanceService.remove(req.params.id, req.user!);

    res.status(204).send();
  }
);
