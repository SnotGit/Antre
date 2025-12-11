import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@models/shared';
import { RoverCategory, RoverItem } from '@models/marsball/rover';
import { handleError, sendNotFound, sendBadRequest } from '@utils/global/helpers';

const prisma = new PrismaClient();

//======= UPDATE CATEGORY =======

export const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const { title } = req.body;

    if (isNaN(categoryId)) {
      sendBadRequest(res, 'ID invalide');
      return;
    }

    if (!title || title.trim().length === 0) {
      sendBadRequest(res, 'Le titre est requis');
      return;
    }

    const category = await prisma.roverCategory.update({
      where: { id: categoryId },
      data: { title: title.trim() }
    });

    const categoryResponse: RoverCategory = {
      id: category.id,
      title: category.title,
      parentId: category.parentId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    };

    res.json({ category: categoryResponse });
  } catch (error) {
    handleError(res, 'Erreur lors de la modification de la catégorie');
  }
};

//======= UPDATE ITEM =======

export const updateItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const itemId = parseInt(req.params.id, 10);
    const { title, description } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (isNaN(itemId)) {
      sendBadRequest(res, 'ID invalide');
      return;
    }

    if (!title || title.trim().length === 0) {
      sendBadRequest(res, 'Le titre est requis');
      return;
    }

    const updateData: any = {
      title: title.trim(),
      description: description !== undefined ? (description.trim() || null) : undefined
    };

    if (files && files['image'] && files['image'].length > 0) {
      const filename = (files['image'][0] as any).filename;
      updateData.imageUrl = `/uploads/rover/full/${filename}`;
      updateData.thumbnailUrl = `/uploads/rover/thumbnails/${filename}`;
    }

    const item = await prisma.roverItem.update({
      where: { id: itemId },
      data: updateData
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

    res.json({ item: itemResponse });
  } catch (error) {
    handleError(res, 'Erreur lors de la modification de l\'item');
  }
};
