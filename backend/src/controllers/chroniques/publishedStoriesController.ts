import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@shared/shared';
import { PublishedStoriesResponse, PublishedStory, EditStory } from '@shared/chroniques';
import { handleError, sendNotFound } from '@utils/global/helpers';

const prisma = new PrismaClient();

//======= GET PUBLISHED STORIES =======

export const getPublishedStories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    
    const published = await prisma.story.findMany({
      where: { 
        userId: userId, 
        status: 'PUBLISHED' 
      },
      orderBy: { publishedAt: 'desc' },
      select: { 
        id: true, 
        title: true, 
        updatedAt: true 
      }
    });
    
    const publishedList: PublishedStory[] = await Promise.all(
      published.map(async (story) => {
        const likesCount = await prisma.like.count({
          where: { storyId: story.id }
        });
        
        return {
          id: story.id,
          title: story.title,
          lastModified: story.updatedAt.toISOString(),
          likes: likesCount
        };
      })
    );

    const response: PublishedStoriesResponse = { stories: publishedList };
    res.json(response);
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des histoires publiées');
  }
};

//======= GET SINGLE PUBLISHED STORY =======

export const getPublishedStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storyId = req.storyId!;
    const userId = req.user.userId;
    
    const story = await prisma.story.findFirst({
      where: { 
        id: storyId,
        userId: userId,
        status: 'PUBLISHED' 
      },
      select: { 
        id: true, 
        title: true, 
        content: true 
      }
    });
    
    if (!story) {
      sendNotFound(res, 'Histoire publiée non trouvée');
      return;
    }
    
    const editStory: EditStory = {
      id: story.id,
      title: story.title,
      content: story.content
    };
    
    res.json({ story: editStory });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération de l\'histoire publiée');
  }
};