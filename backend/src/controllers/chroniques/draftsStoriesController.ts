import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@shared/index';
import { DraftStoriesResponse, DraftStory, EditStory } from '@chroniques-types/index';
import { handleError, sendNotFound } from '@utils/global/helpers';

const prisma = new PrismaClient();

//======= GET ALL DRAFT STORIES =======

export const getDraftStories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    
    const drafts = await prisma.story.findMany({
      where: { 
        userId: userId, 
        status: 'DRAFT' 
      },
      orderBy: { updatedAt: 'desc' },
      select: { 
        id: true, 
        title: true, 
        updatedAt: true 
      }
    });
    
    const draftsList: DraftStory[] = drafts.map(draft => ({
      id: draft.id,
      title: draft.title,
      lastModified: draft.updatedAt.toISOString()
    }));

    const response: DraftStoriesResponse = { stories: draftsList };
    res.json(response);
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des brouillons');
  }
};

//======= GET SINGLE DRAFT STORY =======

export const getDraftStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storyId = req.storyId!;
    const userId = req.user.userId;
    
    const story = await prisma.story.findFirst({
      where: { 
        id: storyId,
        userId: userId,
        status: 'DRAFT' 
      },
      select: { 
        id: true, 
        title: true, 
        content: true 
      }
    });
    
    if (!story) {
      sendNotFound(res, 'Brouillon non trouvé');
      return;
    }
    
    const editStory: EditStory = {
      id: story.id,
      title: story.title,
      content: story.content
    };
    
    res.json({ story: editStory });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération du brouillon');
  }
};