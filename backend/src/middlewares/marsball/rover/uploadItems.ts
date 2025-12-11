import multer from 'multer';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

//======= DIRECTORIES =======

const UPLOAD_DIR = 'uploads/rover';
const FULL_DIR = path.join(UPLOAD_DIR, 'full');
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, 'thumbnails');

[FULL_DIR, THUMBNAIL_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

//======= MULTER =======

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format non supporté'));
  }
};

export const uploadItemImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 500 * 1024 }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

//======= MIDDLEWARE =======

export const processItemImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (files && files['image'] && files['image'][0]) {
      const imageFile = files['image'][0];
      const thumbnailFile = files['thumbnail'] ? files['thumbnail'][0] : null;

      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;

      await sharp(imageFile.buffer)
        .jpeg({ quality: 90 })
        .toFile(path.join(FULL_DIR, filename));

      if (thumbnailFile) {
        await sharp(thumbnailFile.buffer)
          .jpeg({ quality: 85 })
          .toFile(path.join(THUMBNAIL_DIR, filename));
      }

      (imageFile as any).filename = filename;

    } else if (files && files['thumbnail'] && files['thumbnail'][0]) {
      const thumbnailFile = files['thumbnail'][0];
      const itemId = req.params.id;

      if (itemId) {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const item = await prisma.roverItem.findUnique({
          where: { id: parseInt(itemId, 10) },
          select: { imageUrl: true }
        });

        if (item?.imageUrl) {
          const filename = path.basename(item.imageUrl);

          await sharp(thumbnailFile.buffer)
            .jpeg({ quality: 85 })
            .toFile(path.join(THUMBNAIL_DIR, filename));
        }

        await prisma.$disconnect();
      }
    }

    next();
  } catch (error) {
    console.error('Erreur traitement:', error);
    res.status(500).json({ error: 'Erreur traitement image' });
  }
};
