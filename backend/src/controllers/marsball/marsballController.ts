import { Request, Response } from 'express';
import { prisma } from '@db';
import { AuthenticatedRequest } from '@models/shared';
import { handleError, sendNotFound, sendBadRequest } from '@utils/global/helpers';
import { MarsballCategory, MarsballItem, CategoryWithChildrenResponse } from '@models/marsball';
import { indexItem } from '@utils/elena/embeddings';

const UPLOAD_DIR = 'uploads/marsball';

//======= MAPPERS =======

interface CategoryRow {
  id: number;
  title: string;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { items: number };
}

interface ItemRow {
  id: number;
  title: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  description: string | null;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
}

function mapCategory(category: CategoryRow): MarsballCategory {
  return {
    id: category.id,
    title: category.title,
    parentId: category.parentId,
    entryCount: category._count?.items ?? 0,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString()
  };
}

function mapItem(item: ItemRow): MarsballItem {
  return {
    id: item.id,
    title: item.title,
    imageUrl: item.imageUrl,
    thumbnailUrl: item.thumbnailUrl || undefined,
    description: item.description || undefined,
    categoryId: item.categoryId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  };
}

//======= GET ROOT CATEGORIES =======

export const getRootCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.marsballCategory.findMany({
      where: { parentId: null },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { items: true } }
      }
    });

    res.json({ categories: categories.map(mapCategory) });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des catégories racines');
  }
};

//======= GET ALL CATEGORIES =======

export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.marsballCategory.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { items: true } }
      }
    });

    res.json({ categories: categories.map(mapCategory) });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des catégories');
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

    const category = await prisma.marsballCategory.findUnique({
      where: { id: categoryId },
      include: {
        children: {
          orderBy: { createdAt: 'asc' },
          include: { _count: { select: { items: true } } }
        },
        items: { orderBy: { createdAt: 'asc' } },
        _count: { select: { items: true } }
      }
    });

    if (!category) {
      sendNotFound(res, 'Catégorie non trouvée');
      return;
    }

    const response: CategoryWithChildrenResponse = {
      category: mapCategory(category),
      children: category.children.map(mapCategory),
      entries: category.items.map(mapItem)
    };

    res.json(response);
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération de la catégorie');
  }
};

//======= CREATE CATEGORY =======

export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, parentId } = req.body;

    if (!title || title.trim().length === 0) {
      sendBadRequest(res, 'Le titre est requis');
      return;
    }

    if (parentId !== null && parentId !== undefined) {
      const parentExists = await prisma.marsballCategory.findUnique({
        where: { id: parseInt(parentId, 10) }
      });

      if (!parentExists) {
        sendNotFound(res, 'Catégorie parente non trouvée');
        return;
      }
    }

    const category = await prisma.marsballCategory.create({
      data: {
        title: title.trim(),
        parentId: parentId ? parseInt(parentId, 10) : null
      }
    });

    res.status(201).json({ category: mapCategory(category) });
  } catch (error) {
    handleError(res, 'Erreur lors de la création de la catégorie');
  }
};

//======= CREATE ENTRY =======

export const createEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      sendBadRequest(res, "L'image est requise");
      return;
    }

    const categoryExists = await prisma.marsballCategory.findUnique({
      where: { id: parseInt(categoryId, 10) }
    });

    if (!categoryExists) {
      sendNotFound(res, 'Catégorie non trouvée');
      return;
    }

    const filename = (files['image'][0] as Express.Multer.File & { filename: string }).filename;

    const item = await prisma.marsballItem.create({
      data: {
        title: title.trim(),
        imageUrl: `/${UPLOAD_DIR}/full/${filename}`,
        thumbnailUrl: `/${UPLOAD_DIR}/thumbnails/${filename}`,
        description: description ? description.trim() : null,
        categoryId: parseInt(categoryId, 10)
      }
    });

    await indexItem('marsball', item.id);

    res.status(201).json({ entry: mapItem(item) });
  } catch (error) {
    handleError(res, "Erreur lors de la création de l'entrée");
  }
};

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

    const category = await prisma.marsballCategory.update({
      where: { id: categoryId },
      data: { title: title.trim() }
    });

    res.json({ category: mapCategory(category) });
  } catch (error) {
    handleError(res, 'Erreur lors de la modification de la catégorie');
  }
};

//======= UPDATE ENTRY =======

export const updateEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entryId = parseInt(req.params.id, 10);
    const { title, description } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (isNaN(entryId)) {
      sendBadRequest(res, 'ID invalide');
      return;
    }

    if (!title || title.trim().length === 0) {
      sendBadRequest(res, 'Le titre est requis');
      return;
    }

    const updateData: {
      title: string;
      description: string | null | undefined;
      imageUrl?: string;
      thumbnailUrl?: string;
    } = {
      title: title.trim(),
      description: description !== undefined ? (description.trim() || null) : undefined
    };

    if (files && files['image'] && files['image'].length > 0) {
      const filename = (files['image'][0] as Express.Multer.File & { filename: string }).filename;
      updateData.imageUrl = `/${UPLOAD_DIR}/full/${filename}`;
      updateData.thumbnailUrl = `/${UPLOAD_DIR}/thumbnails/${filename}`;
    }

    const item = await prisma.marsballItem.update({
      where: { id: entryId },
      data: updateData
    });

    await indexItem('marsball', item.id);

    res.json({ entry: mapItem(item) });
  } catch (error) {
    handleError(res, "Erreur lors de la modification de l'entrée");
  }
};

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

//======= DELETE ENTRY =======

export const deleteEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entryId = parseInt(req.params.id, 10);

    if (isNaN(entryId)) {
      sendBadRequest(res, 'ID invalide');
      return;
    }

    const entryExists = await prisma.marsballItem.findUnique({
      where: { id: entryId }
    });

    if (!entryExists) {
      sendNotFound(res, 'Entrée non trouvée');
      return;
    }

    await prisma.marsballItem.delete({
      where: { id: entryId }
    });

    res.json({ message: 'Entrée supprimée avec succès' });
  } catch (error) {
    handleError(res, "Erreur lors de la suppression de l'entrée");
  }
};

//======= BATCH DELETE CATEGORIES =======

export const batchDeleteCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      sendBadRequest(res, "Liste d'IDs invalide");
      return;
    }

    const validIds = categoryIds
      .filter((id: string | number) => !isNaN(parseInt(String(id), 10)))
      .map((id: string | number) => parseInt(String(id), 10));

    if (validIds.length === 0) {
      sendBadRequest(res, 'Aucun ID valide');
      return;
    }

    await prisma.marsballCategory.deleteMany({
      where: { id: { in: validIds } }
    });

    res.json({ message: `${validIds.length} catégorie(s) supprimée(s) avec succès` });
  } catch (error) {
    handleError(res, 'Erreur lors de la suppression des catégories');
  }
};

//======= BATCH DELETE ENTRIES =======

export const batchDeleteEntries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { entryIds } = req.body;

    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      sendBadRequest(res, "Liste d'IDs invalide");
      return;
    }

    const validIds = entryIds
      .filter((id: string | number) => !isNaN(parseInt(String(id), 10)))
      .map((id: string | number) => parseInt(String(id), 10));

    if (validIds.length === 0) {
      sendBadRequest(res, 'Aucun ID valide');
      return;
    }

    await prisma.marsballItem.deleteMany({
      where: { id: { in: validIds } }
    });

    res.json({ message: `${validIds.length} entrée(s) supprimée(s) avec succès` });
  } catch (error) {
    handleError(res, 'Erreur lors de la suppression des entrées');
  }
};
