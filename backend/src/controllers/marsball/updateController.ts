import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@models/shared';
import { MarsballCategory, MarsballItem } from '@models/marsball';
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

    const categoryExists = await prisma.marsballCategory.findUnique({
      where: { id: categoryId }
    });

    if (!categoryExists) {
      sendNotFound(res, 'Catégorie non trouvée');
      return;
    }

    const category = await prisma.marsballCategory.update({
      where: { id: categoryId },
      data: { title: title.trim() }
    });

    const categoryResponse: MarsballCategory = {
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

    if (isNaN(itemId)) {
      sendBadRequest(res, 'ID invalide');
      return;
    }

    if (!title || title.trim().length === 0) {
      sendBadRequest(res, 'Le titre est requis');
      return;
    }

    const itemExists = await prisma.marsballItem.findUnique({
      where: { id: itemId }
    });

    if (!itemExists) {
      sendNotFound(res, 'Item non trouvé');
      return;
    }

    const updateData: any = { 
      title: title.trim(),
      description: description !== undefined ? (description.trim() || null) : undefined
    };

    if (req.file) {
      updateData.imageUrl = `/uploads/marsball/full/${req.file.filename}`;
      updateData.thumbnailUrl = `/uploads/marsball/thumbnails/${req.file.filename}`;
    }

    const item = await prisma.marsballItem.update({
      where: { id: itemId },
      data: updateData
    });

    const itemResponse: MarsballItem = {
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