const express = require('express');
const router = express.Router();
const privateStoriesController = require('../controllers/privateStoriesController');
const { authenticateToken } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les brouillons
router.get('/drafts', privateStoriesController.getDrafts);
router.post('/draft', privateStoriesController.saveDraft);
router.put('/draft/:id', privateStoriesController.saveDraft);
router.get('/draft/:id', privateStoriesController.getDraftById);

// Routes pour les histoires publiées
router.get('/published', privateStoriesController.getPublishedStories);
router.post('/publish/:id', privateStoriesController.publishStory);

// Route pour les statistiques
router.get('/stats', privateStoriesController.getStats);

// Route pour supprimer une histoire (brouillon ou publiée)
router.delete('/story/:id', privateStoriesController.deleteStory);

module.exports = router;