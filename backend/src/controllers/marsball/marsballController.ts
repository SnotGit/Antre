import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleError, sendSuccess, sendNotFound, sendError } from '@utils/global/helpers';

const prisma = new PrismaClient();

//======= GET ALL CATEGORIES (PUBLIC) =======

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.marsballCategory.findMany({
      orderBy: { createdAt: 'asc' }
    });

    res.json(categories);
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des catégories');
  }
};

//======= GET CATEGORY WITH LISTS (PUBLIC) =======

export const getCategoryWithLists = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return sendError(res, 'ID de catégorie invalide', 400);
    }

    const category = await prisma.marsballCategory.findUnique({
      where: { id: categoryId },
      include: {
        lists: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!category) {
      return sendNotFound(res, 'Catégorie non trouvée');
    }

    res.json(category);
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération de la catégorie');
  }
};

//======= GET LIST WITH ITEMS (PUBLIC) =======

export const getListWithItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const listId = parseInt(req.params.id);
    if (isNaN(listId)) {
      return sendError(res, 'ID de liste invalide', 400);
    }

    const list = await prisma.marsballList.findUnique({
      where: { id: listId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            thumbnailUrl: true,
            createdAt: true
          }
        },
        category: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!list) {
      return sendNotFound(res, 'Liste non trouvée');
    }

    res.json(list);
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération de la liste');
  }
};

//======= GET ITEM DETAIL (PUBLIC) =======

export const getItemDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) {
      return sendError(res, 'ID d\'item invalide', 400);
    }

    const item = await prisma.marsballItem.findUnique({
      where: { id: itemId },
      include: {
        list: {
          select: {
            id: true,
            title: true,
            categoryId: true,
            category: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    if (!item) {
      return sendNotFound(res, 'Item non trouvé');
    }

    res.json(item);
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération de l\'item');
  }
};

//======= CREATE CATEGORY (ADMIN) =======

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return sendError(res, 'Titre de catégorie requis', 400);
    }

    const category = await prisma.marsballCategory.create({
      data: { title: title.trim() }
    });

    res.status(201).json(category);
  } catch (error) {
    handleError(res, 'Erreur lors de la création de la catégorie');
  }
};

//======= CREATE LIST (ADMIN) =======

export const createList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, categoryId } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return sendError(res, 'Titre de liste requis', 400);
    }

    if (!categoryId || typeof categoryId !== 'number') {
      return sendError(res, 'ID de catégorie requis', 400);
    }

    // Vérifier que la catégorie existe
    const category = await prisma.marsballCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return sendNotFound(res, 'Catégorie non trouvée');
    }

    const list = await prisma.marsballList.create({
      data: {
        title: title.trim(),
        categoryId
      }
    });

    res.status(201).json(list);
  } catch (error) {
    handleError(res, 'Erreur lors de la création de la liste');
  }
};

//======= CREATE ITEM (ADMIN) =======

export const createItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, listId } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return sendError(res, 'Titre d\'item requis', 400);
    }

    if (!listId || typeof listId !== 'number') {
      return sendError(res, 'ID de liste requis', 400);
    }

    if (!files || !files['image'] || files['image'].length === 0) {
      return sendError(res, 'Image requise', 400);
    }

    // Vérifier que la liste existe
    const list = await prisma.marsballList.findUnique({
      where: { id: listId }
    });

    if (!list) {
      return sendNotFound(res, 'Liste non trouvée');
    }

    // Les chemins des images sont générés par le middleware multer + sharp
    const imageUrl = `/uploads/marsball/full/${files['image'][0].filename}`;
    const thumbnailUrl = `/uploads/marsball/thumbnails/${files['image'][0].filename}`;

    const item = await prisma.marsballItem.create({
      data: {
        title: title.trim(),
        imageUrl,
        thumbnailUrl,
        listId
      }
    });

    res.status(201).json(item);
  } catch (error) {
    handleError(res, 'Erreur lors de la création de l\'item');
  }
};