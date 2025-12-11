import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RoverCategory, RoverItem, CategoryWithChildrenResponse } from '@models/marsball/rover';
import { handleError, sendNotFound, sendBadRequest } from '@utils/global/helpers';

const prisma = new PrismaClient();

//======= GET ROOT CATEGORIES =======

export const getRootCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.roverCategory.findMany({
      where: { parentId: null },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        parentId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const categoriesList: RoverCategory[] = categories.map(cat => ({
      id: cat.id,
      title: cat.title,
      parentId: cat.parentId,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString()
    }));

    res.json({ categories: categoriesList });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des catégories racines');
  }
};

//======= GET CATEGORY WITH CHILDREN =======

export const getCategoryWithChildren = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryId = parseInt(req.params.id, 10);

    if (isNaN(categoryId)) {
      sendBadRequest(res, 'ID invalide');
      return;
    }

    const category = await prisma.roverCategory.findUnique({
      where: { id: categoryId },
      include: {
        children: {
          orderBy: { createdAt: 'asc' }
        },
        items: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!category) {
      sendNotFound(res, 'Catégorie non trouvée');
      return;
    }

    const response: CategoryWithChildrenResponse = {
      category: {
        id: category.id,
        title: category.title,
        parentId: category.parentId,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString()
      },
      children: category.children.map(child => ({
        id: child.id,
        title: child.title,
        parentId: child.parentId,
        createdAt: child.createdAt.toISOString(),
        updatedAt: child.updatedAt.toISOString()
      })),
      items: category.items.map(item => ({
        id: item.id,
        title: item.title,
        imageUrl: item.imageUrl,
        thumbnailUrl: item.thumbnailUrl || undefined,
        description: item.description || undefined,
        categoryId: item.categoryId,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      }))
    };

    res.json(response);
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération de la catégorie');
  }
};
