import multer from 'multer';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { prisma } from '@db';

const UPLOAD_DIR = 'uploads/bestiaire';
const MAX_FILE_SIZE = 2 * 1024 * 1024;

//======= DIRECTORIES =======

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

export const uploadEntryImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

//======= PROCESS IMAGE =======

export const processEntryImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      (imageFile as Express.Multer.File & { filename: string }).filename = filename;

    } else if (files && files['thumbnail'] && files['thumbnail'][0]) {
      const thumbnailFile = files['thumbnail'][0];
      const entryId = req.params.id;

      if (entryId) {
        const item = await prisma.bestiaireItem.findUnique({
          where: { id: parseInt(entryId, 10) },
          select: { imageUrl: true }
        });

        if (item?.imageUrl) {
          const filename = path.basename(item.imageUrl);

          await sharp(thumbnailFile.buffer)
            .jpeg({ quality: 85 })
            .toFile(path.join(THUMBNAIL_DIR, filename));
        }
      }
    }

    next();
  } catch {
    res.status(500).json({ error: 'Erreur traitement image' });
  }
};
