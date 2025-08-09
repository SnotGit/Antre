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
router.get('/public/story/:id', getStory);
router.get('/public/user/:userId/stories', getStories);
router.get('/public/story/:id/likes', getLikes);

//======= RESOLVER ROUTES PUBLIQUES =======
router.get('/resolve/username/:username', getUserByUsername);
router.get('/resolve/story/:username/:title', getStoryByUsernameAndTitle);

//======= ROUTES PRIVÉES =======
const privateRouter = express.Router();
privateRouter.use(authenticateToken);

privateRouter.get('/stats', getStats);
privateRouter.get('/drafts', getDrafts);
privateRouter.get('/published', getPublished);
privateRouter.get('/draft/:id', getDraftStory);
privateRouter.get('/published/:id', getPublishedStory);
privateRouter.get('/story/:id', getStoryForEdit);
privateRouter.post('/draft', createDraft);
privateRouter.put('/draft/:id', saveDraft);
privateRouter.post('/publish/:id', publishStory); 
privateRouter.put('/story/:id', updateStory);
privateRouter.delete('/story/:id', deleteStory);
privateRouter.put('/story/:id/like', toggleLike);
privateRouter.get('/user/:userId/totalLikes', getTotalLikes);

//======= RESOLVER ROUTES PRIVÉES =======
privateRouter.get('/resolve/title/:title', getStoryByTitle);

router.use('/private', privateRouter);

module.exports = router;