import { Router } from 'express';
import { authenticateToken } from '@middlewares/auth/authenticateToken';
import { uploadCreatureImage, processCreatureImage } from '@middlewares/marsball/bestiaire/uploadCreatures';

import { getRootCategories, getCategoryWithCreatures } from '@controllers/marsball/bestiaire/getController';
import { createCategory, createCreature } from '@controllers/marsball/bestiaire/createController';
import { updateCategory, updateCreature } from '@controllers/marsball/bestiaire/updateController';
import { deleteCategory, deleteCreature, batchDeleteCategories, batchDeleteCreatures } from '@controllers/marsball/bestiaire/deleteController';

const router = Router();

//======= PUBLIC ROUTES =======

router.get('/categories', getRootCategories);
router.get('/categories/:id', getCategoryWithCreatures);

//======= ADMIN ROUTES =======

router.use(authenticateToken);

router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.post('/categories/batch-delete', batchDeleteCategories);

router.post('/creatures', uploadCreatureImage, processCreatureImage, createCreature);
router.put('/creatures/:id', uploadCreatureImage, processCreatureImage, updateCreature);
router.delete('/creatures/:id', deleteCreature);
router.post('/creatures/batch-delete', batchDeleteCreatures);

export default router;