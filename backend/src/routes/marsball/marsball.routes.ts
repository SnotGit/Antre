import { Router } from 'express';
import { authenticateToken } from '@middlewares/auth/authenticateToken';
import { uploadImage } from '@middlewares/marsball/uploadImage';

import { getRootCategories, getCategoryWithChildren } from '@controllers/marsball/getController';
import { createCategory, createItem } from '@controllers/marsball/createController';
import { updateCategory, updateItem } from '@controllers/marsball/updateController';
import { deleteCategory, deleteItem } from '@controllers/marsball/deleteController';

const router = Router();

//======= PUBLIC ROUTES =======

router.get('/categories', getRootCategories);
router.get('/categories/:id', getCategoryWithChildren);

//======= ADMIN ROUTES =======

router.use(authenticateToken);

router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.post('/items', uploadImage.single('image'), createItem);
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);

export default router;