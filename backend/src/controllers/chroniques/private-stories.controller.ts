import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@models/shared';
import {
  PublishedStoriesResponse,
  PublishedStory,
  EditStory,
  DraftStoriesResponse,
  DraftStory,
  StoryResponse
} from '@models/chroniques';
import {
  handleError,
  sendNotFound,
  sendError,
  sendSuccess,
  parseStoryId
} from '@utils/global/helpers';
import { generateUniqueSlug } from '@utils/chroniques/slug';

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
        content: true,
        originalStoryId: true
      }
    });

    if (!story) {
      sendNotFound(res, 'Histoire publiée non trouvée');
      return;
    }

    const editStory: EditStory = {
      id: story.id,
      title: story.title,
      content: story.content,
      originalStoryId: story.originalStoryId
    };

    res.json({ story: editStory });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération de l\'histoire publiée');
  }
};

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
        content: true,
        originalStoryId: true
      }
    });

    if (!story) {
      sendNotFound(res, 'Brouillon non trouvé');
      return;
    }

    const editStory: EditStory = {
      id: story.id,
      title: story.title,
      content: story.content,
      originalStoryId: story.originalStoryId
    };

    res.json({ story: editStory });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération du brouillon');
  }
};

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

//======= DELETE SINGLE STORY =======

export const deleteStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const story = req.story!;

    await prisma.story.delete({
      where: { id: story.id }
    });

    sendSuccess(res, 'Histoire supprimée');

  } catch (error) {
    handleError(res, 'Erreur lors de la suppression de l\'histoire');
  }
};

//======= DELETE MULTIPLE STORIES =======

export const deleteStories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { storyIds }: { storyIds: number[] } = req.body;

    if (!Array.isArray(storyIds) || storyIds.length === 0) {
      res.status(400).json({ error: 'IDs d\'histoires requis' });
      return;
    }

    const deletedCount = await prisma.story.deleteMany({
      where: {
        id: { in: storyIds },
        userId: userId
      }
    });

    sendSuccess(res, `${deletedCount.count} histoire(s) supprimée(s)`);

  } catch (error) {
    handleError(res, 'Erreur lors de la suppression des histoires');
  }
};
