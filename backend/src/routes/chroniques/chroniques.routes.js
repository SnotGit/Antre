const express = require('express');
const router = express.Router();

const { 
  getLatest,
  getStory,
  getStories,
  getDrafts,
  getPublished,
  getDraftStory,
  getPublishedStory
} = require('../../controllers/chroniques/loadController');

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
  toggleLike
} = require('../../controllers/user/likeController');

const { authenticateToken } = require('../../controllers/auth/authController');

//======= STORIES ROUTES =======

router.get('/stories/latest', getLatest);
router.get('/stories/drafts', authenticateToken, getDrafts);
router.get('/stories/drafts/:id', authenticateToken, getDraftStory);
router.get('/stories/published', authenticateToken, getPublished);
router.get('/stories/published/:id', authenticateToken, getPublishedStory);

//======= STORIES CRUD =======

router.post('/stories/drafts', authenticateToken, createDraft);
router.put('/stories/drafts/:id', authenticateToken, saveDraft);
router.put('/stories/published/:id', authenticateToken, updateStory);
router.delete('/stories/drafts/:id', authenticateToken, deleteStory);
router.delete('/stories/published/:id', authenticateToken, deleteStory);

//======= STORIES ACTIONS =======

router.post('/stories/drafts/:id/publish', authenticateToken, publishStory);

//======= READER ROUTES =======

router.get('/reader/:id', getStory);
router.put('/reader/:id/like', authenticateToken, toggleLike);

//======= USER ROUTES =======

router.get('/user/:userId/stories', getStories);

module.exports = router;