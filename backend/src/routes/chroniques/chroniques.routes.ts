import { Router } from 'express';
import { authenticateToken } from '@middlewares/auth/authenticateToken';
import { validateStoryId } from '@middlewares/chroniques/validateStoryId';
import { validateOwnership } from '@middlewares/chroniques/validateOwnership';
import { errorHandler } from '@middlewares/chroniques/errorHandler';
import * as publicCtrl from '@controllers/chroniques/public-stories.controller';
import * as privateCtrl from '@controllers/chroniques/private-stories.controller';
import { getCount } from '@controllers/user/likeController';

const router = Router();

//======= PUBLIC ROUTES =======

router.get('/stories/latest', publicCtrl.getLatestStories);
router.get('/stories/by-slug/:username/:slug', publicCtrl.getStoryBySlug);
router.get('/stories/user/:userId', publicCtrl.getUserStories);
router.get('/stories/:id', publicCtrl.getUserStory);
router.get('/likes/story/:id/count', getCount);

//======= PROTECTED ROUTES =======

router.use(authenticateToken);

// DRAFTS
router.get('/stories/drafts', privateCtrl.getDraftStories);
router.get('/stories/drafts/:id', validateStoryId, privateCtrl.getDraftStory);
router.post('/stories/drafts', privateCtrl.createDraft);
router.put('/stories/drafts/:id', validateStoryId, privateCtrl.saveDraft);
router.post('/stories/drafts/:id/publish', validateStoryId, privateCtrl.publishStory);
router.post('/stories/drafts/:id/republish', validateStoryId, privateCtrl.republishFromDraft);

// PUBLISHED
router.get('/stories/published', privateCtrl.getPublishedStories);
router.get('/stories/published/:id', validateStoryId, privateCtrl.getPublishedStory);

// DELETE
router.delete('/stories/:id', validateStoryId, validateOwnership, privateCtrl.deleteStory);
router.post('/stories/delete', privateCtrl.deleteStories);

router.use(errorHandler);

export default router;
