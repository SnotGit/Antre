const express = require('express');
const router = express.Router();

//======= CONTROLLERS =======
const { 
  getLatest,
  getStory,
  getStories,
  getDrafts,
  getPublished,
  getDraftStory,
  getPublishedStory,
  getStoryForEdit
} = require('../../controllers/chroniques/loadController');

const {
  getStats
} = require('../../controllers/user/statsController');

const {
  createDraft,
  saveDraft,
  publishStory,
  updateStory
} = require('../../controllers/chroniques/saveController');

const {
  deleteStory
} = require('../../controllers/chroniques/deleteController');

const {
  getUserByUsername,
  getStoryByTitle,
  getStoryByUsernameAndTitle,
} = require('../../controllers/chroniques/resolverController');

const {
  toggleLike,
  getTotalLikes,
  getLikes
} = require('../../controllers/user/likeController');

const { authenticateToken } = require('../../controllers/auth/authController');

//======= ROUTES PUBLIQUES =======
router.get('/public/stories', getLatest);
router.get('/public/stories/:id', getStory);
router.get('/public/users/:userId/stories', getStories);
router.get('/public/stories/:id/likes', getLikes);

//======= RESOLVER ROUTES PUBLIQUES =======
router.get('/resolve/username/:username', getUserByUsername);
router.get('/resolve/story/:username/:title', getStoryByUsernameAndTitle);

//======= ROUTES PRIVÉES =======
const privateRouter = express.Router();
privateRouter.use(authenticateToken);

privateRouter.get('/stats', getStats);
privateRouter.get('/drafts', getDrafts);
privateRouter.get('/drafts/:id', getDraftStory);
privateRouter.get('/stories', getPublished);
privateRouter.get('/stories/:id', getStoryForEdit);
privateRouter.post('/drafts', createDraft);
privateRouter.put('/drafts/:id', saveDraft);
privateRouter.post('/stories/:id/publish', publishStory);
privateRouter.put('/stories/:id', updateStory);
privateRouter.delete('/stories/:id', deleteStory);
privateRouter.put('/stories/:id/like', toggleLike);

//======= RESOLVER ROUTES PRIVÉES =======
privateRouter.get('/resolve/title/:titleUrl', getStoryByTitle);

router.use('/private', privateRouter);

module.exports = router;