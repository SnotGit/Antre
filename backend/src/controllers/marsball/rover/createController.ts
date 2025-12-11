import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@models/shared';
import { RoverCategory, RoverItem } from '@models/marsball/rover';
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
      const parentExists = await prisma.roverCategory.findUnique({
        where: { id: parseInt(parentId, 10) }
      });

      if (!parentExists) {
        sendNotFound(res, 'Catégorie parente non trouvée');
        return;
      }
    }

    const category = await prisma.roverCategory.create({
      data: {
        title: title.trim(),
        parentId: parentId ? parseInt(parentId, 10) : null
      }
    });

    const categoryResponse: RoverCategory = {
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

//======= CREATE ITEM =======

export const createItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const categoryExists = await prisma.roverCategory.findUnique({
      where: { id: parseInt(categoryId, 10) }
    });

    if (!categoryExists) {
      sendNotFound(res, 'Catégorie non trouvée');
      return;
    }

    const filename = (files['image'][0] as any).filename;
    const imageUrl = `/uploads/rover/full/${filename}`;
    const thumbnailUrl = `/uploads/rover/thumbnails/${filename}`;

    const item = await prisma.roverItem.create({
      data: {
        title: title.trim(),
        imageUrl,
        thumbnailUrl,
        description: description ? description.trim() : null,
        categoryId: parseInt(categoryId, 10)
      }
    });

    const itemResponse: RoverItem = {
      id: item.id,
      title: item.title,
      imageUrl: item.imageUrl,
      thumbnailUrl: item.thumbnailUrl || undefined,
      description: item.description || undefined,
      categoryId: item.categoryId,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    };

    res.status(201).json({ item: itemResponse });
  } catch (error) {
    handleError(res, 'Erreur lors de la création de l\'item');
  }
};
