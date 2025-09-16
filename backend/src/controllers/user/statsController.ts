import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleError } from '@utils/global/helpers';

const prisma = new PrismaClient();

interface UserStats {
  drafts: number;
  published: number;
  totalStories: number;
  totalLikes: number;
}

//======= GET STATS =======

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const [draftsCount, publishedCount, totalLikes] = await Promise.all([
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
      }),
      prisma.like.count({
        where: {
          story: {
            userId: userId,
            status: 'PUBLISHED'
          }
        }
      })
    ]);

    const stats: UserStats = {
      drafts: draftsCount,
      published: publishedCount,
      totalStories: draftsCount + publishedCount,
      totalLikes: totalLikes
    };

    res.json({ stats });

  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des statistiques');
  }
};