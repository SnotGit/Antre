import { Router } from 'express';
import { authenticateToken } from '@middlewares/auth/authenticateToken';
import { getProfile, updateProfile } from '@controllers/user/profileController';
import { getStats } from '@controllers/user/statsController';
import { updateEmail, changePassword } from '@controllers/user/credentialsController';
import { getCount, getStatus, toggleLike, getPostedLikes } from '@controllers/user/likeController';
import { getUserStories } from '@controllers/chroniques/publicStoriesController';

const router = Router();

//======= LIKES PUBLIC ROUTES =======

router.get('/likes/story/:id/count', getCount);

//======= PROTECTED ROUTES =======

router.use(authenticateToken);

//======= PROFILE ROUTES =======

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

//======= STATS ROUTES =======

router.get('/stats', getStats);

//======= CREDENTIALS ROUTES =======

router.put('/credentials/email', updateEmail);
router.put('/credentials/password', changePassword);

//======= LIKES ROUTES =======

router.get('/likes/story/:id/status', getStatus);
router.post('/likes/story/:id/toggle', toggleLike);
router.get('/likes/liked-stories', getPostedLikes);

//======= USER STORIES ROUTES =======

router.get('/:userId/stories', getUserStories);

export default router;