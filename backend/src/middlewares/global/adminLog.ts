import { Response, NextFunction } from 'express';
import { appendFileSync, mkdirSync } from 'fs';
import path from 'path';
import { AuthenticatedRequest } from '@models/shared';

const LOG_DIR = 'logs';
const LOG_PATH = path.join(LOG_DIR, 'admin.log');

export const logAdminActions = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  res.on('finish', () => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const entry = {
        at: new Date().toISOString(),
        userId: req.user?.userId ?? null,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        title: body['title'],
        categoryId: body['categoryId'],
        parentId: body['parentId'],
        section: body['section'],
        ids: body['categoryIds'] ?? body['entryIds'],
        files: Array.isArray(req.files) ? req.files.length : undefined
      };
      mkdirSync(LOG_DIR, { recursive: true });
      appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
    } catch {}
  });
  next();
};
