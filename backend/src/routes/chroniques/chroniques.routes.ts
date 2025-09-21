import { Router } from 'express';
import { authenticateToken } from '@middlewares/auth/authenticateToken';
import { validateStoryId } from '@middlewares/chroniques/validateStoryId';
import { validateOwnership } from '@middlewares/chroniques/validateOwnership';
import { errorHandler } from '@middlewares/chroniques/errorHandler';

import { 
  getLatestStories, 
  getUserStory, 
  getUserStories 
} from '@controllers/chroniques/publicStoriesController';

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

//======= PUBLIC ROUTES =======

router.get('/stories/latest', getLatestStories);
router.get('/stories', getUserStories);

//======= AUTHENTICATED ROUTES =======

router.use(authenticateToken);

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

//======= PUBLIC DYNAMIC ROUTE =======

router.get('/stories/:id', getUserStory);

//======= ERROR HANDLER =======

router.use(errorHandler);

export default router;