const express = require('express');

//======= CONTROLLERS =======

const { 
  getLatest,
  getStory,
  getStories,
  getStats,
  getDrafts,
  getPublished,
  getDraftStory,
  getPublishedStory
} = require('../controllers/chroniques/loadController');

const {
  createDraft,
  saveDraft,
  publishStory,
  updateStory
} = require('../controllers/chroniques/saveController');

const {
  deleteStory
} = require('../controllers/chroniques/deleteController');

const {
  toggleLike
} = require('../controllers/chroniques/likeController');

const { authenticateToken } = require('../controllers/authController');

const router = express.Router();

//======= PUBLIC ROUTES =======

router.get('/public/stories', getLatest);
router.get('/public/story/:id', getStory);
router.get('/public/user/:userId/stories', getStories);

//======= PUBLIC ROUTES WITH AUTH =======

router.post('/public/story/:id/like', authenticateToken, toggleLike);

//======= PRIVATE ROUTES =======

const privateRouter = express.Router();
privateRouter.use(authenticateToken);

privateRouter.get('/stats', getStats);
privateRouter.get('/drafts', getDrafts);
privateRouter.get('/published', getPublished);
privateRouter.get('/draft/:id', getDraftStory);
privateRouter.get('/published/:id', getPublishedStory);

privateRouter.post('/draft', createDraft);
privateRouter.put('/draft/:id', saveDraft);
privateRouter.post('/publish/:id', publishStory);  
privateRouter.put('/story/:id', updateStory);

privateRouter.delete('/story/:id', deleteStory);

router.use('/private', privateRouter);

module.exports = router;