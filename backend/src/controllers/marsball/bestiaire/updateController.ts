import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@models/shared';
import { BestiaireCategory, Creature } from '@models/marsball/bestiaire';
import { handleError, sendNotFound, sendBadRequest } from '@utils/global/helpers';

const prisma = new PrismaClient();

//======= UPDATE CATEGORY =======

export const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const { title } = req.body;

    if (isNaN(categoryId)) {
      sendBadRequest(res, 'ID de catégorie invalide');
      return;
    }

    if (!title || title.trim().length === 0) {
      sendBadRequest(res, 'Le titre est requis');
      return;
    }

    const existingCategory = await prisma.bestiaireCategory.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      sendNotFound(res, 'Catégorie non trouvée');
      return;
    }

    const category = await prisma.bestiaireCategory.update({
      where: { id: categoryId },
      data: {
        title: title.trim(),
        updatedAt: new Date()
      }
    });

    const categoryResponse: BestiaireCategory = {
      id: category.id,
      title: category.title,
      parentId: category.parentId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    };

    res.json({ category: categoryResponse });
  } catch (error) {
    handleError(res, 'Erreur lors de la mise à jour de la catégorie');
  }
};

//======= UPDATE CREATURE =======

export const updateCreature = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const creatureId = parseInt(req.params.id, 10);
    const { title, description } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (isNaN(creatureId)) {
      sendBadRequest(res, 'ID de créature invalide');
      return;
    }

    if (!title || title.trim().length === 0) {
      sendBadRequest(res, 'Le titre est requis');
      return;
    }

    const existingCreature = await prisma.creature.findUnique({
      where: { id: creatureId }
    });

    if (!existingCreature) {
      sendNotFound(res, 'Créature non trouvée');
      return;
    }

    const updateData: {
      title: string;
      description: string;
      updatedAt: Date;
      imageUrl?: string;
      thumbnailUrl?: string;
    } = {
      title: title.trim(),
      description: description ? description.trim() : '',
      updatedAt: new Date()
    };

    if (files && files['image'] && files['image'].length > 0) {
      const filename = (files['image'][0] as Express.Multer.File & { filename: string }).filename;
      updateData.imageUrl = `/uploads/bestiaire/full/${filename}`;
      updateData.thumbnailUrl = `/uploads/bestiaire/thumbnails/${filename}`;
    }

    const creature = await prisma.creature.update({
      where: { id: creatureId },
      data: updateData
    });

    const creatureResponse: Creature = {
      id: creature.id,
      title: creature.title,
      imageUrl: creature.imageUrl,
      thumbnailUrl: creature.thumbnailUrl ?? '',
      description: creature.description ?? '',
      categoryId: creature.categoryId,
      createdAt: creature.createdAt.toISOString(),
      updatedAt: creature.updatedAt.toISOString()
    };

    res.json({ creature: creatureResponse });
  } catch (error) {
    handleError(res, 'Erreur lors de la mise à jour de la créature');
  }
};