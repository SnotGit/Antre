import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@models/shared';
import { getStoryWithOwnership } from '@utils/chroniques/helpers';
import { sendNotFound } from '@utils/global/helpers';

export const validateOwnership = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const storyId = req.storyId!;
    const userId = req.user.userId;
    
    const story = await getStoryWithOwnership(storyId, userId);
    
    if (!story) {
      sendNotFound(res, 'Histoire non trouvée');
      return;
    }
    
    req.story = story;
    next();
  } catch (error) {
    console.error('Erreur lors de la validation ownership:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};