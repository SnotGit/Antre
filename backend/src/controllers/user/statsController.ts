import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@models/shared';
import { handleError } from '@utils/global/helpers';

const prisma = new PrismaClient();

interface UserStats {
  drafts: number;
  published: number;
  totalStories: number;
}

//======= GET STATS =======

export const getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;

    const [draftsCount, publishedCount] = await Promise.all([
      prisma.story.count({
        where: {
          userId: userId,
          status: 'DRAFT'
        }
      }),
      prisma.story.count({
        where: {
          userId: userId,
          status: 'PUBLISHED'
        }
      })
    ]);

    const stats: UserStats = {
      drafts: draftsCount,
      published: publishedCount,
      totalStories: draftsCount + publishedCount
    };

    res.json({ stats });

  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des statistiques');
  }
};