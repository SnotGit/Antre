import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { BestiaireCategory, Creature } from '@models/marsball/bestiaire';
import { handleError, sendNotFound } from '@utils/global/helpers';

const prisma = new PrismaClient();

//======= GET ROOT CATEGORIES =======

export const getRootCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.bestiaireCategory.findMany({
      where: { parentId: null },
      orderBy: { title: 'asc' }
    });

    const categoriesResponse: BestiaireCategory[] = categories.map(category => ({
      id: category.id,
      title: category.title,
      parentId: category.parentId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    }));

    res.json({ categories: categoriesResponse });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des catégories');
  }
};

//======= GET CATEGORY WITH CHILDREN AND CREATURES =======

export const getCategoryWithCreatures = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryId = parseInt(req.params.id, 10);

    if (isNaN(categoryId)) {
      sendNotFound(res, 'Catégorie non trouvée');
      return;
    }

    const category = await prisma.bestiaireCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      sendNotFound(res, 'Catégorie non trouvée');
      return;
    }

    const children = await prisma.bestiaireCategory.findMany({
      where: { parentId: categoryId },
      orderBy: { title: 'asc' }
    });

    const creatures = await prisma.creature.findMany({
      where: { categoryId: categoryId },
      orderBy: { title: 'asc' }
    });

    const categoryResponse: BestiaireCategory = {
      id: category.id,
      title: category.title,
      parentId: category.parentId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    };

    const childrenResponse: BestiaireCategory[] = children.map(child => ({
      id: child.id,
      title: child.title,
      parentId: child.parentId,
      createdAt: child.createdAt.toISOString(),
      updatedAt: child.updatedAt.toISOString()
    }));

    const creaturesResponse: Creature[] = creatures.map(creature => ({
      id: creature.id,
      title: creature.title,
      imageUrl: creature.imageUrl,
      thumbnailUrl: creature.thumbnailUrl ?? '',
      description: creature.description ?? '',
      categoryId: creature.categoryId,
      createdAt: creature.createdAt.toISOString(),
      updatedAt: creature.updatedAt.toISOString()
    }));

    res.json({
      category: categoryResponse,
      children: childrenResponse,
      creatures: creaturesResponse
    });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération de la catégorie');
  }
};