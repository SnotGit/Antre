import { Router } from 'express';
import { authenticateToken, requireAdmin } from '@middlewares/auth/authenticateToken';
import { logAdminActions } from '@middlewares/global/adminLog';
import { getStats } from '@controllers/admin/adminController';

const router = Router();

//======= ADMIN ROUTES =======

router.use(authenticateToken);
router.use(requireAdmin);
router.use(logAdminActions);

router.get('/stats', getStats);

export default router;
