const express = require('express');
const { 
  getLatest,
  getStory,
  getStories,
  getStats,
  getDrafts,
  getPublished,
  getDraftStory,
  getPublishedStory
} = require('../controllers/loadController');
const { authenticateToken } = require('../controllers/authController');

const router = express.Router();

//======= PUBLIC ROUTES =======

router.get('/latest', getLatest);
router.get('/story/:id', getStory);
router.get('/stories/:userId', getStories);

//======= PRIVATE ROUTES =======

router.get('/stats', authenticateToken, getStats);
router.get('/drafts', authenticateToken, getDrafts);
router.get('/published', authenticateToken, getPublished);
router.get('/draft-story/:id', authenticateToken, getDraftStory);
router.get('/published-story/:id', authenticateToken, getPublishedStory);

module.exports = router;