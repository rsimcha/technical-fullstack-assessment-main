import { Router } from 'express';
import { listUsers } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { listUsersQuerySchema } from '../validators/userSchemas';

const router = Router();

router.get('/', authenticate, validateQuery(listUsersQuerySchema), listUsers);

export default router;
