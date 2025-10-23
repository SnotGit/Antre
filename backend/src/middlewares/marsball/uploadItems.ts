import multer from 'multer';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

const prisma = new PrismaClient();

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
    console.log('\n========== DEBUG CROP ==========');
    console.log('cropX:', req.body.cropX);
    console.log('cropY:', req.body.cropY);
    console.log('cropSize:', req.body.cropSize);
    console.log('imageWidth:', req.body.imageWidth);
    console.log('imageHeight:', req.body.imageHeight);
    console.log('req.file présent:', !!req.file);
    console.log('req.params.id:', req.params.id);

    const cropX = parseInt(req.body.cropX || '0', 10);
    const cropY = parseInt(req.body.cropY || '0', 10);
    const cropSize = parseInt(req.body.cropSize || '60', 10);
    const displayWidth = parseInt(req.body.imageWidth || '0', 10);
    const displayHeight = parseInt(req.body.imageHeight || '0', 10);

    console.log('Parsed cropX:', cropX);
    console.log('Parsed cropY:', cropY);
    console.log('Parsed cropSize:', cropSize);
    console.log('Parsed displayWidth:', displayWidth);
    console.log('Parsed displayHeight:', displayHeight);

    if (req.file) {
      console.log('\n--- CRÉATION AVEC NOUVELLE IMAGE ---');
      
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
      const metadata = await sharp(req.file.buffer).metadata();
      const originalWidth = metadata.width || 1;
      const originalHeight = metadata.height || 1;

      console.log('Image originale width:', originalWidth);
      console.log('Image originale height:', originalHeight);

      const ratioX = displayWidth > 0 ? originalWidth / displayWidth : 1;
      const ratioY = displayHeight > 0 ? originalHeight / displayHeight : 1;

      console.log('Ratio X:', ratioX);
      console.log('Ratio Y:', ratioY);

      const adjustedCropX = Math.round(cropX * ratioX);
      const adjustedCropY = Math.round(cropY * ratioY);
      const adjustedCropSize = Math.round(cropSize * ratioX);

      console.log('Crop ajusté X:', adjustedCropX);
      console.log('Crop ajusté Y:', adjustedCropY);
      console.log('Crop ajusté Size:', adjustedCropSize);

      await sharp(req.file.buffer)
        .jpeg({ quality: 90 })
        .toFile(path.join(FULL_DIR, filename));

      console.log('Image complète sauvegardée:', filename);

      await sharp(req.file.buffer)
        .extract({ 
          left: adjustedCropX, 
          top: adjustedCropY, 
          width: adjustedCropSize, 
          height: adjustedCropSize 
        })
        .resize(60, 60, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toFile(path.join(THUMBNAIL_DIR, filename));

      console.log('Thumbnail cropé sauvegardé:', filename);
      console.log('================================\n');

      (req.file as any).filename = filename;
      
    } else if (cropX && cropY && cropSize && displayWidth && displayHeight && req.params.id) {
      console.log('\n--- MODIFICATION CROP UNIQUEMENT ---');
      
      const itemId = parseInt(req.params.id, 10);
      
      const item = await prisma.marsballItem.findUnique({
        where: { id: itemId },
        select: { imageUrl: true }
      });

      if (item && item.imageUrl) {
        const filename = path.basename(item.imageUrl);
        const fullImagePath = path.join(FULL_DIR, filename);

        console.log('Filename existant:', filename);
        console.log('Path image complète:', fullImagePath);
        console.log('Fichier existe:', existsSync(fullImagePath));

        if (existsSync(fullImagePath)) {
          const metadata = await sharp(fullImagePath).metadata();
          const originalWidth = metadata.width || 1;
          const originalHeight = metadata.height || 1;

          console.log('Image originale width:', originalWidth);
          console.log('Image originale height:', originalHeight);

          const ratioX = originalWidth / displayWidth;
          const ratioY = originalHeight / displayHeight;

          console.log('Ratio X:', ratioX);
          console.log('Ratio Y:', ratioY);

          const adjustedCropX = Math.round(cropX * ratioX);
          const adjustedCropY = Math.round(cropY * ratioY);
          const adjustedCropSize = Math.round(cropSize * ratioX);

          console.log('Crop ajusté X:', adjustedCropX);
          console.log('Crop ajusté Y:', adjustedCropY);
          console.log('Crop ajusté Size:', adjustedCropSize);

          await sharp(fullImagePath)
            .extract({ 
              left: adjustedCropX, 
              top: adjustedCropY, 
              width: adjustedCropSize, 
              height: adjustedCropSize 
            })
            .resize(60, 60, { fit: 'cover' })
            .jpeg({ quality: 85 })
            .toFile(path.join(THUMBNAIL_DIR, filename));

          console.log('Thumbnail régénéré:', filename);
          console.log('================================\n');
        }
      }
    } else {
      console.log('\n--- AUCUN TRAITEMENT (données manquantes) ---');
      console.log('================================\n');
    }
    
    next();
  } catch (error) {
    console.error('\n❌ ERREUR lors du traitement:', error);
    console.log('================================\n');
    res.status(500).json({ error: 'Erreur lors du traitement de l\'image' });
  }
};