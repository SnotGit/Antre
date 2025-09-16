import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleError, sendError, sendNotFound, parseStoryId } from '@utils/global/helpers';
import { StoryCard } from '@chroniques-types/index';

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

export const getStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const storyId = parseStoryId(req.params.id);
    if (storyId === null) return sendError(res, 'ID invalide', 400);

    const story = await getPublishedStory(storyId);
    if (!story) return sendNotFound(res, 'Histoire non trouvée');

    const userId = req.user!.userId;
    const existingLike = await prisma.like.findFirst({ where: { storyId, userId } });
    
    res.json({ 
      storyId, 
      isLiked: !!existingLike, 
      canLike: story.userId !== userId 
    });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération du statut de like');
  }
};

//======= TOGGLE LIKE (PRIVATE) =======

export const toggleLike = async (req: Request, res: Response): Promise<void> => {
  try {
    const storyId = parseStoryId(req.params.id);
    if (storyId === null) return sendError(res, 'ID invalide', 400);

    const story = await getPublishedStory(storyId);
    if (!story) return sendNotFound(res, 'Histoire non trouvée');

    const userId = req.user!.userId;
    if (story.userId === userId) return sendError(res, 'Impossible de liker ses propres histoires', 403);

    const existingLike = await prisma.like.findFirst({ where: { storyId, userId } });
    
    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
    } else {
      await prisma.like.create({ data: { storyId, userId } });
    }

    const likesCount = await prisma.like.count({ where: { storyId } });
    res.json({ liked: !existingLike, likesCount });
  } catch (error) {
    handleError(res, 'Erreur lors du toggle like');
  }
};

//======= GET POSTED LIKES (PRIVATE) =======

export const getPostedLikes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userLikes = await prisma.like.findMany({
      where: { 
        userId,
        story: { status: 'PUBLISHED' }
      },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            publishedAt: true,
            user: { select: { id: true, username: true, avatar: true } }
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    const stories: StoryCard[] = userLikes.map(like => ({
      id: like.story.id,
      title: like.story.title,
      publishDate: like.story.publishedAt!.toISOString(),
      user: {
        id: like.story.user.id,
        username: like.story.user.username,
        avatar: like.story.user.avatar || ''
      }
    }));

    res.json({ stories });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des histoires likées');
  }
};