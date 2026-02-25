import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@models/shared';
import { StoryResponse } from '@models/chroniques';
import { parseStoryId, sendError, sendSuccess, sendNotFound, handleError } from '@utils/global/helpers';
import { generateUniqueSlug } from '@utils/chroniques/slug';

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

    const slug = await generateUniqueSlug(prisma, story.title, userId);

    await prisma.story.update({
      where: { id: storyId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        slug
      }
    });

    sendSuccess(res, 'Histoire publiée');

  } catch (error) {
    handleError(res, 'Erreur lors de la publication de l\'histoire');
  }
};

//======= REPUBLISH FROM DRAFT =======

export const republishFromDraft = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const draftId = parseStoryId(id);
    const userId = req.user.userId;

    if (draftId === null) {
      return sendError(res, 'ID invalide', 400);
    }

    const draft = await prisma.story.findFirst({
      where: { id: draftId, userId, status: 'DRAFT' }
    });

    if (!draft || !draft.originalStoryId) {
      return sendNotFound(res, 'Brouillon de republication non trouvé');
    }

    const original = await prisma.story.findFirst({
      where: { id: draft.originalStoryId, userId, status: 'PUBLISHED' }
    });

    if (!original) {
      return sendNotFound(res, 'Histoire originale non trouvée');
    }

    const slug = await generateUniqueSlug(prisma, draft.title, userId, original.id);

    await prisma.story.update({
      where: { id: original.id },
      data: { title: draft.title, content: draft.content, slug }
    });

    await prisma.story.delete({ where: { id: draftId } });

    sendSuccess(res, 'Histoire republiée');

  } catch (error) {
    handleError(res, 'Erreur lors de la republication');
  }
};