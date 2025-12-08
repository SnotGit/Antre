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
      sendBadRequest(res, 'ID de catégorie invalide');
      return;
    }

    const existingCategory = await prisma.bestiaireCategory.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      sendNotFound(res, 'Catégorie non trouvée');
      return;
    }

    await prisma.bestiaireCategory.delete({
      where: { id: categoryId }
    });

    res.json({ message: 'Catégorie supprimée' });
  } catch (error) {
    handleError(res, 'Erreur lors de la suppression de la catégorie');
  }
};

//======= BATCH DELETE CATEGORIES =======

export const batchDeleteCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      sendBadRequest(res, 'Liste d\'IDs requise');
      return;
    }

    const categoryIds = ids.map((id: number) => parseInt(String(id), 10));

    await prisma.bestiaireCategory.deleteMany({
      where: { id: { in: categoryIds } }
    });

    res.json({ message: 'Catégories supprimées' });
  } catch (error) {
    handleError(res, 'Erreur lors de la suppression des catégories');
  }
};

//======= DELETE CREATURE =======

export const deleteCreature = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const creatureId = parseInt(req.params.id, 10);

    if (isNaN(creatureId)) {
      sendBadRequest(res, 'ID de créature invalide');
      return;
    }

    const existingCreature = await prisma.creature.findUnique({
      where: { id: creatureId }
    });

    if (!existingCreature) {
      sendNotFound(res, 'Créature non trouvée');
      return;
    }

    await prisma.creature.delete({
      where: { id: creatureId }
    });

    res.json({ message: 'Créature supprimée' });
  } catch (error) {
    handleError(res, 'Erreur lors de la suppression de la créature');
  }
};

//======= BATCH DELETE CREATURES =======

export const batchDeleteCreatures = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      sendBadRequest(res, 'Liste d\'IDs requise');
      return;
    }

    const creatureIds = ids.map((id: number) => parseInt(String(id), 10));

    await prisma.creature.deleteMany({
      where: { id: { in: creatureIds } }
    });

    res.json({ message: 'Créatures supprimées' });
  } catch (error) {
    handleError(res, 'Erreur lors de la suppression des créatures');
  }
};