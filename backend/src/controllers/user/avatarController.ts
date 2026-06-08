import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { AuthenticatedRequest } from '@models/shared';
import { handleError } from '@utils/global/helpers';
import { userSelectFields } from '@utils/chroniques/helpers';

const prisma = new PrismaClient();

const AVATAR_DIR = 'uploads/avatars';

//======= MULTER =======

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!existsSync(AVATAR_DIR)) {
      mkdirSync(AVATAR_DIR, { recursive: true });
    }
    cb(null, AVATAR_DIR);
  },
  filename: (req: Request, file, cb) => {
    const userId = (req as AuthenticatedRequest).user.userId;
    cb(null, `user-${userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  }
}).single('avatar');

//======= UPDATE AVATAR =======

export const updateAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier fourni' });
      return;
    }

    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    if (current?.avatar) {
      const oldPath = current.avatar.replace(/^\//, '');
      if (existsSync(oldPath)) {
        unlinkSync(oldPath);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: `/uploads/avatars/${req.file.filename}` },
      select: userSelectFields
    });

    res.json({
      message: 'Avatar mis à jour avec succès',
      user
    });

  } catch (error) {
    handleError(res, 'Erreur lors de la mise à jour de l\'avatar');
  }
};
