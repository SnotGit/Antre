import { Router } from 'express';
import { authenticateToken, requireAdmin } from '@middlewares/auth/authenticateToken';
import { VaultContextConfig } from './config';
import { createVaultControllers } from './controllerFactory';
import { createUploadMiddleware } from './uploadFactory';

//======= FACTORY =======

export function createVaultRoutes(config: VaultContextConfig): Router {
  const router = Router();
  const controllers = createVaultControllers(config);
  const { uploadEntryImage, processEntryImage } = createUploadMiddleware(config);

  //======= PUBLIC ROUTES =======

  router.get('/categories', controllers.getRootCategories);
  router.get('/categories/:id', controllers.getCategoryWithChildren);

  //======= ADMIN ROUTES =======

  router.use(authenticateToken);
  router.use(requireAdmin);

  router.post('/categories', controllers.createCategory);
  router.put('/categories/:id', controllers.updateCategory);
  router.delete('/categories/:id', controllers.deleteCategory);
  router.post('/categories/batch-delete', controllers.batchDeleteCategories);

  router.post('/entries', uploadEntryImage, processEntryImage, controllers.createEntry);
  router.put('/entries/:id', uploadEntryImage, processEntryImage, controllers.updateEntry);
  router.delete('/entries/:id', controllers.deleteEntry);
  router.post('/entries/batch-delete', controllers.batchDeleteEntries);

  return router;
}
