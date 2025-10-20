import multer from 'multer';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

//======= DIRECTORIES CONFIGURATION =======

const UPLOAD_DIR = 'uploads/marsball';
const FULL_DIR = path.join(UPLOAD_DIR, 'full');
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, 'thumbnails');

[FULL_DIR, THUMBNAIL_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

//======= MULTER CONFIGURATION =======

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.'));
  }
};

export const uploadItemImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024
  }
});

//======= IMAGE PROCESSING MIDDLEWARE =======

export const processItemImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      return next();
    }

    const cropX = parseInt(req.body.cropX || '0', 10);
    const cropY = parseInt(req.body.cropY || '0', 10);
    const cropSize = parseInt(req.body.cropSize || '60', 10);

    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;

    await sharp(req.file.buffer)
      .jpeg({ quality: 90 })
      .toFile(path.join(FULL_DIR, filename));

    await sharp(req.file.buffer)
      .extract({ left: cropX, top: cropY, width: cropSize, height: cropSize })
      .resize(60, 60, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(path.join(THUMBNAIL_DIR, filename));

    (req.file as any).filename = filename;
    
    next();
  } catch (error) {
    console.error('Erreur lors du traitement de l\'image:', error);
    res.status(500).json({ error: 'Erreur lors du traitement de l\'image' });
  }
};