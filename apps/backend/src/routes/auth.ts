import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  refreshToken,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/authSchemas';

const router = Router();

// Public routes
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.post('/refresh', authenticate, refreshToken);

export default router;
