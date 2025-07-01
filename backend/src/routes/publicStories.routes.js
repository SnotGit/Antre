const express = require('express');
const router = express.Router();
const publicStoriesController = require('../controllers/publicStoriesController');

// Routes publiques (accessibles à tous)
router.get('/', publicStoriesController.getLatestStories);

// Routes pour les profils utilisateur publics
router.get('/users/:id', publicStoriesController.getUserProfile);

module.exports = router;