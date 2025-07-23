const express = require('express');
const router = express.Router();
const publicStoriesController = require('../controllers/publicStoriesController');

//============ DERNIÈRES HISTOIRES ============

router.get('/', publicStoriesController.getLatestStories);

//============ PROFILS UTILISATEURS ============

router.get('/users/:id', publicStoriesController.getUserProfile);

//============ HISTOIRES INDIVIDUELLES ============

router.get('/story/:username/:title', publicStoriesController.getStoryByUsernameAndTitle);

module.exports = router;