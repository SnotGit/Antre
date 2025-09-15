import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

//======= INTERFACES =======

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

//======= HELPERS FACTORISÉS =======

const parseStoryId = (id: string): number | null => {
  const storyId = parseInt(id);
  return isNaN(storyId) ? null : storyId;
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

    res.json({ story });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
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
      res.status(400).json({ error: 'ID invalide' });
      return;
    }

    const story = await prisma.story.findFirst({
      where: { 
        id: storyId,
        userId: userId,
        status: 'DRAFT' 
      }
    });

    if (!story) {
      res.status(404).json({ error: 'Brouillon non trouvé' });
      return;
    }

    await prisma.story.update({
      where: { id: storyId },
      data: { title, content }
    });

    res.status(200).json({ message: 'Brouillon sauvegardé' });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= PUBLISH STORY =======

export const publishStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const storyId = parseStoryId(id);
    const userId = req.user.userId;

    if (storyId === null) {
      res.status(400).json({ error: 'ID invalide' });
      return;
    }

    const story = await prisma.story.findFirst({
      where: { 
        id: storyId,
        userId: userId,
        status: 'DRAFT' 
      }
    });

    if (!story) {
      res.status(404).json({ error: 'Brouillon non trouvé' });
      return;
    }

    await prisma.story.update({
      where: { id: storyId },
      data: { 
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    });

    res.status(200).json({ message: 'Histoire publiée' });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
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
      res.status(400).json({ error: 'ID invalide' });
      return;
    }

    const story = await prisma.story.findFirst({
      where: { 
        id: storyId,
        userId: userId,
        status: 'PUBLISHED' 
      }
    });

    if (!story) {
      res.status(404).json({ error: 'Histoire publiée non trouvée' });
      return;
    }

    await prisma.story.update({
      where: { id: storyId },
      data: { title, content }
    });

    res.status(200).json({ message: 'Histoire mise à jour' });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};