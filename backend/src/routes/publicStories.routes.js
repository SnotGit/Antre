const express = require('express');
const router = express.Router();
const publicStoriesController = require('../controllers/publicStoriesController');
const { authenticateToken } = require('../controllers/authController');

router.get('/', publicStoriesController.getLatestStories);
router.get('/users/:id', publicStoriesController.getUserProfile);
router.get('/story/:id', publicStoriesController.getStoryById);
router.get('/story/:username/:title', publicStoriesController.getStoryByUsernameAndTitle);

router.post('/story/:id/like', authenticateToken, publicStoriesController.toggleLike);

module.exports = router;