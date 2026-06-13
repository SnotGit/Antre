import { Router } from 'express';
import { authenticateToken, requireAdmin } from '@middlewares/auth/authenticateToken';
import { logAdminActions } from '@middlewares/global/adminLog';
import { uploadEntryImage, processEntryImage } from '@middlewares/marsball/uploadImages';
import {
  getRootCategories,
  getAllCategories,
  getCategoryWithChildren,
  createCategory,
  createEntry,
  updateCategory,
  updateEntry,
  deleteCategory,
  deleteEntry,
  batchDeleteCategories,
  batchDeleteEntries
} from '@controllers/marsball/marsballController';

const router = Router();

//======= PUBLIC ROUTES =======

router.get('/categories', getRootCategories);
router.get('/categories/all', getAllCategories);
router.get('/categories/:id', getCategoryWithChildren);

//======= ADMIN ROUTES =======

router.use(authenticateToken);
router.use(requireAdmin);
router.use(logAdminActions);

router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.post('/categories/batch-delete', batchDeleteCategories);

router.post('/entries', uploadEntryImage, processEntryImage, createEntry);
router.put('/entries/:id', uploadEntryImage, processEntryImage, updateEntry);
router.delete('/entries/:id', deleteEntry);
router.post('/entries/batch-delete', batchDeleteEntries);

export default router;
