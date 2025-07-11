const express = require('express');
const router = express.Router();
const privateStoriesController = require('../controllers/privateStoriesController');
const { authenticateToken } = require('../controllers/authController');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Statistiques utilisateur
router.get('/stats', privateStoriesController.getStats);

// Gestion des brouillons
router.get('/drafts', privateStoriesController.getDrafts);
router.post('/draft', privateStoriesController.saveDraft);
router.put('/draft/:id', privateStoriesController.updateDraft);

// Gestion des histoires publiées
router.get('/published', privateStoriesController.getPublishedStories);
router.post('/publish/:id', privateStoriesController.publishStory);

// Édition d'histoires
router.get('/edit/:slug', privateStoriesController.getStoryForEdit);
router.post('/republish/:id', privateStoriesController.republishStory);

// Suppression d'histoires
router.delete('/story/:id', privateStoriesController.deleteStory);

module.exports = router;