import { Response } from 'express';
import { prisma } from '@db';
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
  sendSuccess
} from '@utils/global/helpers';
import { generateUniqueSlug } from '@utils/chroniques/slug';

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
        updatedAt: true,
        originalStoryId: true
      }
    });

    const draftsList: DraftStory[] = drafts.map(draft => ({
      id: draft.id,
      title: draft.title,
      lastModified: draft.updatedAt.toISOString(),
      originalStoryId: draft.originalStoryId
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

    const editStory: EditStory = story;

    res.json({ story: editStory });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération du brouillon');
  }
};

//======= GET ALL PUBLISHED STORIES =======

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
        updatedAt: true,
        _count: {
          select: { likes: true }
        }
      }
    });

    const publishedList: PublishedStory[] = published.map(story => ({
      id: story.id,
      title: story.title,
      lastModified: story.updatedAt.toISOString(),
      likes: story._count.likes
    }));

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

    const editStory: EditStory = story;

    res.json({ story: editStory });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération de l\'histoire publiée');
  }
};

//======= CREATE DRAFT =======

export const createDraft = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { title = '', content = '', originalStoryId } = req.body;

    if (typeof title !== 'string' || typeof content !== 'string') {
      return sendError(res, 'Données invalides', 400);
    }

    if (title.length > 200) {
      return sendError(res, 'Titre trop long (200 caractères maximum)', 400);
    }

    let originalId: number | undefined;

    if (originalStoryId !== undefined && originalStoryId !== null) {

      originalId = Number(originalStoryId);

      if (!Number.isInteger(originalId) || originalId <= 0) {
        return sendError(res, 'ID original invalide', 400);
      }

      const original = await prisma.story.findFirst({
        where: { id: originalId, userId, status: 'PUBLISHED' },
        select: { id: true }
      });

      if (!original) {
        return sendNotFound(res, 'Histoire originale non trouvée');
      }

      const existingRevision = await prisma.story.findFirst({
        where: { originalStoryId: originalId, userId, status: 'DRAFT' },
        select: { id: true }
      });

      if (existingRevision) {
        return sendError(res, 'Une révision existe déjà pour cette histoire', 409);
      }
    }

    const story = await prisma.story.create({
      data: {
        title,
        content,
        userId,
        status: 'DRAFT',
        ...(originalId && { originalStoryId: originalId })
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
    const storyId = req.storyId!;
    const userId = req.user.userId;
    const { title, content } = req.body;

    if (typeof title !== 'string' || typeof content !== 'string') {
      return sendError(res, 'Données invalides', 400);
    }

    if (title.length > 200) {
      return sendError(res, 'Titre trop long (200 caractères maximum)', 400);
    }

    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
        status: 'DRAFT'
      },
      select: { id: true }
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
    const storyId = req.storyId!;
    const userId = req.user.userId;

    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
        status: 'DRAFT'
      },
      select: { id: true, title: true, originalStoryId: true }
    });

    if (!story) {
      return sendNotFound(res, 'Brouillon non trouvé');
    }

    if (story.originalStoryId) {
      return sendError(res, 'Ce brouillon est une révision : utiliser la republication', 400);
    }

    if (!story.title.trim()) {
      return sendError(res, 'Un titre est requis pour publier', 400);
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
    const draftId = req.storyId!;
    const userId = req.user.userId;

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

    if (!draft.title.trim()) {
      return sendError(res, 'Un titre est requis pour republier', 400);
    }

    const slug = await generateUniqueSlug(prisma, draft.title, userId, original.id);

    await prisma.$transaction([
      prisma.story.update({
        where: { id: original.id },
        data: { title: draft.title, content: draft.content, slug }
      }),
      prisma.story.delete({ where: { id: draftId } })
    ]);

    sendSuccess(res, 'Histoire republiée');

  } catch (error) {
    handleError(res, 'Erreur lors de la republication');
  }
};

//======= DELETE STORY =======

export const deleteStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const story = req.story!;

    await prisma.$transaction([
      prisma.story.updateMany({
        where: { originalStoryId: story.id },
        data: { originalStoryId: null }
      }),
      prisma.story.delete({ where: { id: story.id } })
    ]);

    sendSuccess(res, 'Histoire supprimée');

  } catch (error) {
    handleError(res, 'Erreur lors de la suppression de l\'histoire');
  }
};
