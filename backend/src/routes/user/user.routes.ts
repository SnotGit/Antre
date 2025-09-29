import { Router } from 'express';
import { authenticateToken } from '@middlewares/auth/authenticateToken';
import { validateStoryId } from '@middlewares/chroniques/validateStoryId';
import { validateOwnership } from '@middlewares/chroniques/validateOwnership';
import { errorHandler } from '@middlewares/chroniques/errorHandler';

import { getProfile, updateProfile } from '@controllers/user/profileController';
import { getStats } from '@controllers/user/statsController';
import { updateEmail, changePassword } from '@controllers/user/credentialsController';
import { getStatus, toggleLike, getPostedLikes } from '@controllers/user/likeController';

import { 
  getDraftStories, 
  getDraftStory 
} from '@controllers/chroniques/draftsStoriesController';

import { 
  getPublishedStories, 
  getPublishedStory 
} from '@controllers/chroniques/publishedStoriesController';

import { 
  createDraft, 
  saveDraft, 
  publishStory, 
  updateStory 
} from '@controllers/chroniques/saveStoriesController';

import { 
  deleteStory, 
  deleteStories 
} from '@controllers/chroniques/deleteStoriesController';

const router = Router();

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

//======= DRAFT ROUTES =======

router.get('/stories/drafts', getDraftStories);
router.get('/stories/drafts/:id', validateStoryId, getDraftStory);
router.post('/stories/drafts', createDraft);
router.put('/stories/drafts/:id', validateStoryId, saveDraft);
router.post('/stories/drafts/:id/publish', validateStoryId, publishStory);

//======= PUBLISHED ROUTES =======

router.get('/stories/published', getPublishedStories);
router.get('/stories/published/:id', validateStoryId, getPublishedStory);
router.put('/stories/published/:id', validateStoryId, updateStory);

//======= DELETE ROUTES =======

router.delete('/stories/:id', validateStoryId, validateOwnership, deleteStory);
router.post('/stories/delete', deleteStories);

//======= ERROR HANDLER =======

router.use(errorHandler);

export default router;