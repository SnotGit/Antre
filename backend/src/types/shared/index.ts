import { Request } from 'express';

//======= AUTHENTICATED REQUEST =======

export interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
  storyId?: number;
  story?: {
    id: number;
    title: string;
    content: string;
    userId: number;
  };
}

//======= STANDARD RESPONSES =======

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  message: string;
}