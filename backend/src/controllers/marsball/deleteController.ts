import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@models/shared';
import { handleError, sendNotFound, sendBadRequest } from '@utils/global/helpers';

const prisma = new PrismaClient();

//======= DELETE CATEGORY =======

export const deleteCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categoryId = parseInt(req.params.id, 10);

    if (isNaN(categoryId)) {
      sendBadRequest(res, 'ID invalide');
      return;
    }

    const categoryExists = await prisma.marsballCategory.findUnique({
      where: { id: categoryId }
    });

    if (!categoryExists) {
      sendNotFound(res, 'Catégorie non trouvée');
      return;
    }

    await prisma.marsballCategory.delete({
      where: { id: categoryId }
    });

    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    handleError(res, 'Erreur lors de la suppression de la catégorie');
  }
};

//======= DELETE ITEM =======

export const deleteItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const itemId = parseInt(req.params.id, 10);

    if (isNaN(itemId)) {
      sendBadRequest(res, 'ID invalide');
      return;
    }

    const itemExists = await prisma.marsballItem.findUnique({
      where: { id: itemId }
    });

    if (!itemExists) {
      sendNotFound(res, 'Item non trouvé');
      return;
    }

    await prisma.marsballItem.delete({
      where: { id: itemId }
    });

    res.json({ message: 'Item supprimé avec succès' });
  } catch (error) {
    handleError(res, 'Erreur lors de la suppression de l\'item');
  }
};