import { Request, Response } from 'express';
import { prisma } from '@db';
import { AuthenticatedRequest } from '@models/shared';
import { handleError, sendNotFound, sendBadRequest } from '@utils/global/helpers';
import { VaultContextConfig } from './config';
import { VaultCategory, VaultEntry, CategoryWithChildrenResponse } from './models';


//======= PRISMA DELEGATE TYPE =======

interface PrismaDelegate {
  findMany: (args: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
  findUnique: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
  create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  delete: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  deleteMany: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

//======= MAPPERS =======

function mapCategory(raw: Record<string, unknown>, entryRelation?: string): VaultCategory {
  const countObj = raw['_count'] as Record<string, number> | undefined;
  const entryCount = entryRelation && countObj ? countObj[entryRelation] ?? 0 : 0;
  return {
    id: raw['id'] as number,
    title: raw['title'] as string,
    parentId: raw['parentId'] as number | null,
    entryCount,
    createdAt: (raw['createdAt'] as Date).toISOString(),
    updatedAt: (raw['updatedAt'] as Date).toISOString()
  };
}

function mapEntry(raw: Record<string, unknown>): VaultEntry {
  return {
    id: raw['id'] as number,
    title: raw['title'] as string,
    imageUrl: raw['imageUrl'] as string,
    thumbnailUrl: (raw['thumbnailUrl'] as string | null) || undefined,
    description: (raw['description'] as string | null) || undefined,
    categoryId: raw['categoryId'] as number,
    createdAt: (raw['createdAt'] as Date).toISOString(),
    updatedAt: (raw['updatedAt'] as Date).toISOString()
  };
}

//======= FACTORY =======

export function createVaultControllers(config: VaultContextConfig) {

  const categoryDelegate = (prisma as unknown as Record<string, PrismaDelegate>)[config.categoryModel];
  const entryDelegate = (prisma as unknown as Record<string, PrismaDelegate>)[config.entryModel];

  //======= GET ROOT CATEGORIES =======

  const getRootCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await categoryDelegate.findMany({
        where: { parentId: null },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          title: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { [config.entryRelation]: true } }
        }
      });

      res.json({ categories: categories.map(c => mapCategory(c, config.entryRelation)) });
    } catch (error) {
      handleError(res, 'Erreur lors de la récupération des catégories racines');
    }
  };

  //======= GET ALL CATEGORIES =======

  const getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await categoryDelegate.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          title: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { [config.entryRelation]: true } }
        }
      });

      res.json({ categories: categories.map(c => mapCategory(c, config.entryRelation)) });
    } catch (error) {
      handleError(res, 'Erreur lors de la récupération des catégories');
    }
  };

  //======= GET CATEGORY WITH CHILDREN =======

  const getCategoryWithChildren = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryId = parseInt(req.params.id, 10);

      if (isNaN(categoryId)) {
        sendBadRequest(res, 'ID invalide');
        return;
      }

      const category = await categoryDelegate.findUnique({
        where: { id: categoryId },
        include: {
          children: {
            orderBy: { createdAt: 'asc' },
            include: { _count: { select: { [config.entryRelation]: true } } }
          },
          [config.entryRelation]: { orderBy: { createdAt: 'asc' } },
          _count: { select: { [config.entryRelation]: true } }
        }
      });

      if (!category) {
        sendNotFound(res, 'Catégorie non trouvée');
        return;
      }

      const children = (category['children'] as Record<string, unknown>[]) || [];
      const entries = (category[config.entryRelation] as Record<string, unknown>[]) || [];

      const response: CategoryWithChildrenResponse = {
        category: mapCategory(category, config.entryRelation),
        children: children.map(c => mapCategory(c, config.entryRelation)),
        entries: entries.map(mapEntry)
      };

      res.json(response);
    } catch (error) {
      handleError(res, 'Erreur lors de la récupération de la catégorie');
    }
  };

  //======= CREATE CATEGORY =======

  const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { title, parentId } = req.body;

      if (!title || title.trim().length === 0) {
        sendBadRequest(res, 'Le titre est requis');
        return;
      }

      if (parentId !== null && parentId !== undefined) {
        const parentExists = await categoryDelegate.findUnique({
          where: { id: parseInt(parentId, 10) }
        });

        if (!parentExists) {
          sendNotFound(res, 'Catégorie parente non trouvée');
          return;
        }
      }

      const category = await categoryDelegate.create({
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

  const createEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      const categoryExists = await categoryDelegate.findUnique({
        where: { id: parseInt(categoryId, 10) }
      });

      if (!categoryExists) {
        sendNotFound(res, 'Catégorie non trouvée');
        return;
      }

      const filename = (files['image'][0] as Express.Multer.File & { filename: string }).filename;
      const imageUrl = `/${config.uploadDir}/full/${filename}`;
      const thumbnailUrl = `/${config.uploadDir}/thumbnails/${filename}`;

      const entry = await entryDelegate.create({
        data: {
          title: title.trim(),
          imageUrl,
          thumbnailUrl,
          description: description ? description.trim() : null,
          categoryId: parseInt(categoryId, 10)
        }
      });

      res.status(201).json({ entry: mapEntry(entry) });
    } catch (error) {
      handleError(res, "Erreur lors de la création de l'entrée");
    }
  };

  //======= UPDATE CATEGORY =======

  const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      const category = await categoryDelegate.update({
        where: { id: categoryId },
        data: { title: title.trim() }
      });

      res.json({ category: mapCategory(category) });
    } catch (error) {
      handleError(res, 'Erreur lors de la modification de la catégorie');
    }
  };

  //======= UPDATE ENTRY =======

  const updateEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      const updateData: Record<string, unknown> = {
        title: title.trim(),
        description: description !== undefined ? (description.trim() || null) : undefined
      };

      if (files && files['image'] && files['image'].length > 0) {
        const filename = (files['image'][0] as Express.Multer.File & { filename: string }).filename;
        updateData['imageUrl'] = `/${config.uploadDir}/full/${filename}`;
        updateData['thumbnailUrl'] = `/${config.uploadDir}/thumbnails/${filename}`;
      }

      const entry = await entryDelegate.update({
        where: { id: entryId },
        data: updateData
      });

      res.json({ entry: mapEntry(entry) });
    } catch (error) {
      handleError(res, "Erreur lors de la modification de l'entrée");
    }
  };

  //======= DELETE CATEGORY =======

  const deleteCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const categoryId = parseInt(req.params.id, 10);

      if (isNaN(categoryId)) {
        sendBadRequest(res, 'ID invalide');
        return;
      }

      const categoryExists = await categoryDelegate.findUnique({
        where: { id: categoryId }
      });

      if (!categoryExists) {
        sendNotFound(res, 'Catégorie non trouvée');
        return;
      }

      await categoryDelegate.delete({
        where: { id: categoryId }
      });

      res.json({ message: 'Catégorie supprimée avec succès' });
    } catch (error) {
      handleError(res, 'Erreur lors de la suppression de la catégorie');
    }
  };

  //======= DELETE ENTRY =======

  const deleteEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const entryId = parseInt(req.params.id, 10);

      if (isNaN(entryId)) {
        sendBadRequest(res, 'ID invalide');
        return;
      }

      const entryExists = await entryDelegate.findUnique({
        where: { id: entryId }
      });

      if (!entryExists) {
        sendNotFound(res, 'Entrée non trouvée');
        return;
      }

      await entryDelegate.delete({
        where: { id: entryId }
      });

      res.json({ message: 'Entrée supprimée avec succès' });
    } catch (error) {
      handleError(res, "Erreur lors de la suppression de l'entrée");
    }
  };

  //======= BATCH DELETE CATEGORIES =======

  const batchDeleteCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      await categoryDelegate.deleteMany({
        where: { id: { in: validIds } }
      });

      res.json({ message: `${validIds.length} catégorie(s) supprimée(s) avec succès` });
    } catch (error) {
      handleError(res, 'Erreur lors de la suppression des catégories');
    }
  };

  //======= BATCH DELETE ENTRIES =======

  const batchDeleteEntries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      await entryDelegate.deleteMany({
        where: { id: { in: validIds } }
      });

      res.json({ message: `${validIds.length} entrée(s) supprimée(s) avec succès` });
    } catch (error) {
      handleError(res, 'Erreur lors de la suppression des entrées');
    }
  };

  return {
    getRootCategories,
    getAllCategories,
    getCategoryWithChildren,
    createCategory,
    createEntry,
    updateCategory,
    updateEntry,
    deleteCategory,
    deleteEntry,
    batchDeleteCategories,
    batchDeleteEntries
  };
}
