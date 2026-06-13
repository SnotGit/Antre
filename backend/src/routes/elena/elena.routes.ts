import { Router } from 'express';
import { authenticateToken, requireAdmin } from '@middlewares/auth/authenticateToken';
import { logAdminActions } from '@middlewares/global/adminLog';
import { uploadLot } from '@middlewares/elena/uploadLot';
import { depositLot, searchArchives } from '@controllers/elena/elenaController';

const router = Router();

//======= MEMBER ROUTES =======

router.use(authenticateToken);

router.post('/search', searchArchives);

//======= ADMIN ROUTES =======

router.use(requireAdmin);
router.use(logAdminActions);

router.post('/lots', uploadLot, depositLot);

export default router;
