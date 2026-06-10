import { Request, Response } from 'express';
import { prisma } from '@db';
import { AuthenticatedRequest } from '@models/shared';
import { StoriesResponse, StoryReader, UserStories } from '@models/chroniques';
import { handleError, sendNotFound } from '@utils/global/helpers';

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
        slug: true,
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
      slug: story.slug,
      publishDate: story.publishedAt!.toISOString(),
      user: {
        id: story.user.id,
        username: story.user.username,
        avatar: story.user.avatar || ''
      }
    }));

    const response: StoriesResponse = { stories: storyCards };
    res.json(response);
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des histoires');
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

    const stories: UserStories[] = await prisma.story.findMany({
      where: {
        userId: userId,
        status: 'PUBLISHED'
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true
      }
    });

    res.json({ stories });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des histoires de l\'utilisateur');
  }
};

//======= GET STORY BY SLUG =======

export const getStoryBySlug = async (req: Request | AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { username, slug } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      sendNotFound(res, 'Utilisateur non trouvé');
      return;
    }

    const story = await prisma.story.findFirst({
      where: { userId: user.id, slug, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        content: true,
        publishedAt: true,
        userId: true,
        _count: {
          select: { likes: true }
        },
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

    const currentUserId = (req as AuthenticatedRequest).user?.userId;
    const isOwnStory = currentUserId ? story.userId === currentUserId : false;

    let isliked = false;
    if (currentUserId && !isOwnStory) {
      const userLike = await prisma.like.findFirst({
        where: { storyId: story.id, userId: currentUserId }
      });
      isliked = !!userLike;
    }

    const storyData: StoryReader = {
      id: story.id,
      title: story.title,
      content: story.content,
      publishDate: story.publishedAt!.toISOString(),
      likes: story._count.likes,
      isliked,
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
