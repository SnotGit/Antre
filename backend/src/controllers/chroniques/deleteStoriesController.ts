import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@shared/shared';
import { handleError, sendSuccess } from '@utils/global/helpers';

const prisma = new PrismaClient();

//======= DELETE SINGLE STORY =======

export const deleteStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const story = req.story!;
    
    await prisma.story.delete({
      where: { id: story.id }
    });

    sendSuccess(res, 'Histoire supprimée');

  } catch (error) {
    handleError(res, 'Erreur lors de la suppression de l\'histoire');
  }
};

//======= DELETE MULTIPLE STORIES =======

export const deleteStories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { storyIds }: { storyIds: number[] } = req.body;

    if (!Array.isArray(storyIds) || storyIds.length === 0) {
      res.status(400).json({ error: 'IDs d\'histoires requis' });
      return;
    }

    const deletedCount = await prisma.story.deleteMany({
      where: {
        id: { in: storyIds },
        userId: userId
      }
    });

    sendSuccess(res, `${deletedCount.count} histoire(s) supprimée(s)`);

  } catch (error) {
    handleError(res, 'Erreur lors de la suppression des histoires');
  }
};