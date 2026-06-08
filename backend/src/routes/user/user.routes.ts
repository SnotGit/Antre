import { Router } from 'express';
import { authenticateToken } from '@middlewares/auth/authenticateToken';
import { errorHandler } from '@middlewares/chroniques/errorHandler';

import { getProfile, updateProfile } from '@controllers/user/profileController';
import { uploadAvatar, updateAvatar } from '@controllers/user/avatarController';
import { getStats } from '@controllers/user/statsController';
import { updateEmail, changePassword } from '@controllers/user/credentialsController';

const router = Router();

//======= PROTECTED ROUTES =======

router.use(authenticateToken);

//======= PROFILE ROUTES =======

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/avatar', uploadAvatar, updateAvatar);

//======= STATS ROUTES =======

router.get('/stats', getStats);

//======= CREDENTIALS ROUTES =======

router.put('/credentials/email', updateEmail);
router.put('/credentials/password', changePassword);

//======= ERROR HANDLER =======

router.use(errorHandler);

export default router;
