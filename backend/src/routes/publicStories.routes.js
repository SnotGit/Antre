const express = require('express');
const router = express.Router();
const publicStoriesController = require('../controllers/publicStoriesController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', publicStoriesController.getLatestStories);
router.get('/users/:id', publicStoriesController.getUserProfile);
router.get('/story/:slug', publicStoriesController.getStoryBySlug);
router.post('/story/:id/like', authenticateToken, publicStoriesController.toggleLike);

module.exports = router;