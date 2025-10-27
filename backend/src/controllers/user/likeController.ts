import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@models/shared';
import { handleError, sendError, sendNotFound, parseStoryId } from '@utils/global/helpers';

const prisma = new PrismaClient();

//======= HELPER =======

const getPublishedStory = async (storyId: number) => {
  return await prisma.story.findFirst({
    where: { id: storyId, status: 'PUBLISHED' }
  });
};

//======= GET COUNT (PUBLIC) =======

export const getCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const storyId = parseStoryId(req.params.id);
    if (storyId === null) return sendError(res, 'ID invalide', 400);

    const story = await getPublishedStory(storyId);
    if (!story) return sendNotFound(res, 'Histoire non trouvée');

    const likesCount = await prisma.like.count({ where: { storyId } });
    res.json({ storyId, likesCount });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération du nombre de likes');
  }
};

//======= GET STATUS (PRIVATE) =======

export const getStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storyId = parseStoryId(req.params.id);
    if (storyId === null) return sendError(res, 'ID invalide', 400);

    const story = await getPublishedStory(storyId);
    if (!story) return sendNotFound(res, 'Histoire non trouvée');

    const userId = req.user.userId;
    const isOwnStory = story.userId === userId;
    const existingLike = await prisma.like.findFirst({ where: { storyId, userId } });
    
    res.json({ 
      storyId, 
      isLiked: !!existingLike,
      canLike: !isOwnStory
    });
  } catch (error) {
    handleError(res, 'Erreur lors de la vérification du statut du like');
  }
};

//======= TOGGLE LIKE (PRIVATE) =======

export const toggleLike = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storyId = parseStoryId(req.params.id);
    if (storyId === null) return sendError(res, 'ID invalide', 400);

    const story = await getPublishedStory(storyId);
    if (!story) return sendNotFound(res, 'Histoire non trouvée');

    const userId = req.user.userId;

    if (story.userId === userId) {
      return sendError(res, 'Vous ne pouvez pas liker votre propre histoire', 403);
    }

    const existingLike = await prisma.like.findFirst({ where: { storyId, userId } });
    
    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      res.json({ message: 'Like retiré', isLiked: false });
    } else {
      await prisma.like.create({ data: { storyId, userId } });
      res.json({ message: 'Like ajouté', isLiked: true });
    }
  } catch (error) {
    handleError(res, 'Erreur lors du toggle du like');
  }
};

//======= GET POSTED LIKES LIST (PRIVATE) =======

export const getPostedLikesList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    
    const stories = await prisma.story.findMany({
      where: {
        likes: {
          some: {
            userId: userId
          }
        },
        status: 'PUBLISHED',
        userId: { not: userId }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        likes: {
          where: {
            userId: userId
          },
          select: {
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    const likedStories = stories
      .map(story => ({
        storyId: story.id,
        title: story.title,
        publishDate: story.publishedAt!.toISOString(),
        likedAt: story.likes[0].createdAt.toISOString(),
        user: {
          id: story.user.id,
          username: story.user.username,
          avatar: story.user.avatar || ''
        }
      }))
      .sort((a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime());

    res.json({ likedStories });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des histoires likées');
  }
};

//======= GET RECEIVED LIKES COUNT (PRIVATE) =======

export const getReceivedLikesCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;

    const receivedLikes = await prisma.like.count({
      where: {
        story: {
          userId: userId,
          status: 'PUBLISHED'
        },
        userId: { not: userId }
      }
    });

    res.json({ receivedLikes });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération du nombre de likes reçus');
  }
};

//======= GET POSTED LIKES COUNT (PRIVATE) =======

export const getPostedLikesCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;

    const postedLikes = await prisma.like.count({
      where: {
        userId: userId,
        story: {
          userId: { not: userId }
        }
      }
    });

    res.json({ postedLikes });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération du nombre de likes postés');
  }
};

//======= GET RECEIVED LIKES LIST (PRIVATE) =======

export const getReceivedLikesList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;

    const stories = await prisma.story.findMany({
      where: {
        userId: userId,
        status: 'PUBLISHED',
        likes: {
          some: {
            userId: { not: userId }
          }
        }
      },
      include: {
        likes: {
          where: {
            userId: { not: userId }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            likes: {
              where: {
                userId: { not: userId }
              }
            }
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    const receivedLikes = stories.map(story => ({
      storyId: story.id,
      title: story.title,
      publishDate: story.publishedAt!.toISOString(),
      likesCount: story._count.likes,
      lastLikedAt: story.likes[0]?.createdAt.toISOString() || story.publishedAt!.toISOString()
    }));

    res.json({ receivedLikes });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération de la liste des likes reçus');
  }
};