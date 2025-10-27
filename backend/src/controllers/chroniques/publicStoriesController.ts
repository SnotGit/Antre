import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@models/shared';
import { handleError, sendNotFound, parseStoryId } from '@utils/global/helpers';

const prisma = new PrismaClient();

//======= GET LATEST STORIES =======

export const getLatestStories = async (req: Request, res: Response): Promise<void> => {
  try {
    const stories = await prisma.story.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      distinct: ['userId'],
      take: 6,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    const storyCards = stories.map(story => ({
      id: story.id,
      title: story.title,
      publishDate: story.publishedAt!.toISOString(),
      user: {
        id: story.user.id,
        username: story.user.username,
        avatar: story.user.avatar || ''
      }
    }));

    const response = { stories: storyCards };
    res.json(response);
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des histoires');
  }
};

//======= GET SINGLE STORY =======

export const getUserStory = async (req: Request | AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storyId = parseStoryId(req.params.id);
    if (storyId === null) {
      sendNotFound(res, 'Histoire non trouvée');
      return;
    }

    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        content: true,
        publishedAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            description: true
          }
        }
      }
    });

    if (!story) {
      sendNotFound(res, 'Histoire non trouvée');
      return;
    }

    const likesCount = await prisma.like.count({
      where: { storyId: story.id }
    });

    const currentUserId = (req as AuthenticatedRequest).user?.userId;
    const isOwnStory = currentUserId ? story.userId === currentUserId : false;
    
    let isliked = false;
    if (currentUserId && !isOwnStory) {
      const userLike = await prisma.like.findFirst({
        where: {
          storyId: story.id,
          userId: currentUserId
        }
      });
      isliked = !!userLike;
    }

    const storyData = {
      id: story.id,
      title: story.title,
      content: story.content,
      publishDate: story.publishedAt!.toISOString(),
      likes: likesCount,
      isliked,
      canLike: !isOwnStory,
      user: {
        id: story.user.id,
        username: story.user.username,
        avatar: story.user.avatar || '',
        description: story.user.description || ''
      }
    };

    res.json({ story: storyData });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération de l\'histoire');
  }
};

//======= GET USER STORIES =======

export const getUserStories = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);  
    
    if (isNaN(userId)) {
      sendNotFound(res, 'Utilisateur non trouvé');
      return;
    }

    const stories = await prisma.story.findMany({
      where: {
        userId: userId,
        status: 'PUBLISHED'
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true
      }
    });

    res.json({ stories });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des histoires de l\'utilisateur');
  }
};