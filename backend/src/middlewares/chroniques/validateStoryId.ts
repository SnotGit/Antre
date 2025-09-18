import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@models/shared';
import { parseStoryId, sendBadRequest } from '@utils/global/helpers';

export const validateStoryId = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const storyId = parseStoryId(req.params.id);
  
  if (storyId === null) {
    sendBadRequest(res, 'ID invalide');
    return;
  }
  
  req.storyId = storyId;
  next();
};