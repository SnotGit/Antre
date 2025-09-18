import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '@models/shared';

interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (error: AppError, req: Request, res: Response, next: NextFunction): void => {
  console.error('Erreur middleware:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  const errorResponse: ErrorResponse = {
    error: error.message || 'Erreur serveur'
  };
  
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json(errorResponse);
};