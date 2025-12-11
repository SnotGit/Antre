import { Router } from 'express';
import { authenticateToken } from '@middlewares/auth/authenticateToken';
import { uploadItemImage, processItemImage } from '@middlewares/marsball/rover/uploadItems';

import { getRootCategories, getCategoryWithChildren } from '@controllers/marsball/rover/getController';
import { createCategory, createItem } from '@controllers/marsball/rover/createController';
import { updateCategory, updateItem } from '@controllers/marsball/rover/updateController';
import { deleteCategory, deleteItem, batchDeleteCategories, batchDeleteItems } from '@controllers/marsball/rover/deleteController';

const router = Router();

//======= PUBLIC ROUTES =======

router.get('/categories', getRootCategories);
router.get('/categories/:id', getCategoryWithChildren);

//======= ADMIN ROUTES =======

router.use(authenticateToken);

router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.post('/categories/batch-delete', batchDeleteCategories);

router.post('/items', uploadItemImage, processItemImage, createItem);
router.put('/items/:id', uploadItemImage, processItemImage, updateItem);
router.delete('/items/:id', deleteItem);
router.post('/items/batch-delete', batchDeleteItems);

export default router;
