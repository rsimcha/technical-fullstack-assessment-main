import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { authService } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';

export const register = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  }
);

export const login = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const result = await authService.login(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  }
);

export const getProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user: req.user },
    });
  }
);

export const refreshToken = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const user = await authService.verifyToken(token);

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: { user },
    });
  }
);
