import { Router } from 'express';
import {
  createRequest,
  listRequests,
  getRequest,
  updateRequest,
  deleteRequest,
} from '../controllers/maintenanceController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createMaintenanceRequestSchema,
  updateMaintenanceRequestSchema,
  idParamSchema,
} from '../validators/maintenanceSchemas';

const router = Router();

// Tenant-only: creating a request
router.post(
  '/',
  authenticate,
  authorize('tenant'),
  validateBody(createMaintenanceRequestSchema),
  createRequest
);

// Shared (authenticated) routes
router.get('/', authenticate, listRequests);
router.get('/:id', authenticate, validateParams(idParamSchema), getRequest);

// Manager/admin only
router.patch(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  validateParams(idParamSchema),
  validateBody(updateMaintenanceRequestSchema),
  updateRequest
);
router.delete(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  validateParams(idParamSchema),
  deleteRequest
);

export default router;
