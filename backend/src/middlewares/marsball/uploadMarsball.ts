import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

//======= CONFIGURATION DOSSIERS =======

const UPLOAD_DIR = 'uploads/marsball';
const FULL_DIR = path.join(UPLOAD_DIR, 'full');
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, 'thumbnails');

// Créer les dossiers s'ils n'existent pas
[FULL_DIR, THUMBNAIL_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

//======= CONFIGURATION MULTER =======

const storage = multer.memoryStorage();

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format d\'image non supporté. Utilisez JPG, PNG ou WEBP.'));
  }
};

export const uploadMarsball = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 // 500KB max
  }
});

//======= MIDDLEWARE TRAITEMENT IMAGE =======

export const processImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (!files || !files['image'] || files['image'].length === 0) {
      return next();
    }

    const file = files['image'][0];
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;

    // Générer l'image complète
    await sharp(file.buffer)
      .jpeg({ quality: 90 })
      .toFile(path.join(FULL_DIR, filename));

    // Générer le thumbnail (crop du header - 100px hauteur)
    await sharp(file.buffer)
      .resize({
        height: 100,
        fit: 'cover',
        position: 'top'
      })
      .jpeg({ quality: 85 })
      .toFile(path.join(THUMBNAIL_DIR, filename));

    // Ajouter le nom du fichier à la requête
    file.filename = filename;

    next();
  } catch (error) {
    console.error('Erreur lors du traitement de l\'image:', error);
    res.status(500).json({ error: 'Erreur lors du traitement de l\'image' });
  }
};