import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@shared/shared';
import { StoryResponse } from '@shared/chroniques';
import { parseStoryId, sendError, sendSuccess, sendNotFound, handleError } from '@utils/global/helpers';

const prisma = new PrismaClient();

//======= CREATE DRAFT =======

export const createDraft = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { title = '', content = '', originalStoryId } = req.body;

    const story = await prisma.story.create({
      data: {
        title,
        content,
        userId,
        status: 'DRAFT',
        ...(originalStoryId && { originalStoryId })
      },
      select: {
        id: true,
        title: true,
        content: true
      }
    });

    const response: StoryResponse = { story };
    res.json(response);

  } catch (error) {
    handleError(res, 'Erreur lors de la création du brouillon');
  }
};

//======= SAVE DRAFT =======

export const saveDraft = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const storyId = parseStoryId(id);
    const userId = req.user.userId;
    const { title, content } = req.body;

    if (storyId === null) {
      return sendError(res, 'ID invalide', 400);
    }

    const story = await prisma.story.findFirst({
      where: { 
        id: storyId,
        userId: userId,
        status: 'DRAFT' 
      }
    });

    if (!story) {
      return sendNotFound(res, 'Brouillon non trouvé');
    }

    await prisma.story.update({
      where: { id: storyId },
      data: { title, content }
    });

    sendSuccess(res, 'Brouillon sauvegardé');

  } catch (error) {
    handleError(res, 'Erreur lors de la sauvegarde du brouillon');
  }
};

//======= PUBLISH STORY =======

export const publishStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const storyId = parseStoryId(id);
    const userId = req.user.userId;

    if (storyId === null) {
      return sendError(res, 'ID invalide', 400);
    }

    const story = await prisma.story.findFirst({
      where: { 
        id: storyId,
        userId: userId,
        status: 'DRAFT' 
      }
    });

    if (!story) {
      return sendNotFound(res, 'Brouillon non trouvé');
    }

    await prisma.story.update({
      where: { id: storyId },
      data: { 
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    });

    sendSuccess(res, 'Histoire publiée');

  } catch (error) {
    handleError(res, 'Erreur lors de la publication de l\'histoire');
  }
};

//======= UPDATE STORY =======

export const updateStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const storyId = parseStoryId(id);
    const userId = req.user.userId;
    const { title, content } = req.body;

    if (storyId === null) {
      return sendError(res, 'ID invalide', 400);
    }

    const story = await prisma.story.findFirst({
      where: { 
        id: storyId,
        userId: userId,
        status: 'PUBLISHED' 
      }
    });

    if (!story) {
      return sendNotFound(res, 'Histoire publiée non trouvée');
    }

    await prisma.story.update({
      where: { id: storyId },
      data: { title, content }
    });

    sendSuccess(res, 'Histoire mise à jour');

  } catch (error) {
    handleError(res, 'Erreur lors de la mise à jour de l\'histoire');
  }
};