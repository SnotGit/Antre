import multer from 'multer';
import { Request } from 'express';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 400;

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isImage = file.mimetype.startsWith('image/');
  const isTxt = file.originalname.toLowerCase().endsWith('.txt');

  if (isImage || isTxt) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

export const uploadLot = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES }
}).array('files', MAX_FILES);
