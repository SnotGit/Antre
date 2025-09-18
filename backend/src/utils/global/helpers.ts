import { Response } from 'express';
import { ErrorResponse, SuccessResponse } from '@models/shared';

//======= ID PARSING =======

export const parseStoryId = (id: string): number | null => {
  const storyId = parseInt(id, 10);
  return isNaN(storyId) || storyId <= 0 ? null : storyId;
};

//======= ERROR HANDLING =======

export const handleError = (res: Response, message: string = 'Erreur serveur'): void => {
  console.error(message);
  const errorResponse: ErrorResponse = { error: message };
  res.status(500).json(errorResponse);
};

//======= RESPONSE HELPERS =======

export const sendError = (res: Response, message: string, statusCode: number): void => {
  const errorResponse: ErrorResponse = { error: message };
  res.status(statusCode).json(errorResponse);
};

export const sendSuccess = (res: Response, message: string, statusCode: number = 200): void => {
  const successResponse: SuccessResponse = { message };
  res.status(statusCode).json(successResponse);
};

export const sendNotFound = (res: Response, message: string): void => {
  sendError(res, message, 404);
};

export const sendBadRequest = (res: Response, message: string): void => {
  sendError(res, message, 400);
};