import { Router } from 'express';
import { authenticateToken } from '@middlewares/auth/authenticateToken';
import { uploadMarsball, processImage } from '@middlewares/marsball/uploadMarsball';
import {
  getCategories,
  getCategoryWithLists,
  getListWithItems,
  getItemDetail,
  createCategory,
  createList,
  createItem
} from '@controllers/marsball/marsballController';

const router = Router();

//======= PUBLIC ROUTES =======

router.get('/categories', getCategories);
router.get('/categories/:id', getCategoryWithLists);
router.get('/lists/:id', getListWithItems);
router.get('/items/:id', getItemDetail);

//======= PROTECTED ADMIN ROUTES =======

router.use(authenticateToken);

router.post('/categories', createCategory);
router.post('/lists', createList);
router.post('/items', uploadMarsball.fields([{ name: 'image', maxCount: 1 }]), processImage, createItem);

export default router;