import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@models/shared';
import { BestiaireCategory, Creature } from '@models/marsball/bestiaire';
import { handleError, sendNotFound, sendBadRequest } from '@utils/global/helpers';

const prisma = new PrismaClient();

//======= CREATE CATEGORY =======

export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, parentId } = req.body;

    if (!title || title.trim().length === 0) {
      sendBadRequest(res, 'Le titre est requis');
      return;
    }

    if (parentId !== null && parentId !== undefined) {
      const parentExists = await prisma.bestiaireCategory.findUnique({
        where: { id: parseInt(parentId, 10) }
      });

      if (!parentExists) {
        sendNotFound(res, 'Catégorie parente non trouvée');
        return;
      }
    }

    const category = await prisma.bestiaireCategory.create({
      data: {
        title: title.trim(),
        parentId: parentId ? parseInt(parentId, 10) : null
      }
    });

    const categoryResponse: BestiaireCategory = {
      id: category.id,
      title: category.title,
      parentId: category.parentId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    };

    res.status(201).json({ category: categoryResponse });
  } catch (error) {
    handleError(res, 'Erreur lors de la création de la catégorie');
  }
};

//======= CREATE CREATURE =======

export const createCreature = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, categoryId, description } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!title || title.trim().length === 0) {
      sendBadRequest(res, 'Le titre est requis');
      return;
    }

    if (!categoryId) {
      sendBadRequest(res, 'La catégorie est requise');
      return;
    }

    if (!files || !files['image'] || files['image'].length === 0) {
      sendBadRequest(res, 'L\'image est requise');
      return;
    }

    const categoryExists = await prisma.bestiaireCategory.findUnique({
      where: { id: parseInt(categoryId, 10) }
    });

    if (!categoryExists) {
      sendNotFound(res, 'Catégorie non trouvée');
      return;
    }

    const filename = (files['image'][0] as Express.Multer.File & { filename: string }).filename;
    const imageUrl = `/uploads/bestiaire/full/${filename}`;
    const thumbnailUrl = `/uploads/bestiaire/thumbnails/${filename}`;

    const creature = await prisma.creature.create({
      data: {
        title: title.trim(),
        imageUrl,
        thumbnailUrl,
        description: description ? description.trim() : '',
        categoryId: parseInt(categoryId, 10)
      }
    });

    const creatureResponse: Creature = {
      id: creature.id,
      title: creature.title,
      imageUrl: creature.imageUrl,
      thumbnailUrl: creature.thumbnailUrl ?? '',
      description: creature.description ?? '',
      categoryId: creature.categoryId,
      createdAt: creature.createdAt.toISOString(),
      updatedAt: creature.updatedAt.toISOString()
    };

    res.status(201).json({ creature: creatureResponse });
  } catch (error) {
    handleError(res, 'Erreur lors de la création de la créature');
  }
};