import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '@utils/global/helpers';
import { getJwtSecret } from '@controllers/auth/jwtConfig';

interface JwtPayload {
  userId: number;
  role?: string;
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    sendError(res, 'Token manquant', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.user = { userId: decoded.userId, role: decoded.role || 'user' };
    next();
  } catch (error) {
    sendError(res, 'Token invalide', 403);
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as import('@models/shared').AuthenticatedRequest).user;

  if (!user || user.role !== 'admin') {
    sendError(res, 'Accès réservé aux administrateurs', 403);
    return;
  }

  next();
};