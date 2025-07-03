const express = require('express');
const router = express.Router();
const privateStoriesController = require('../controllers/privateStoriesController');
const { authenticateToken } = require('../controllers/authController');

//============ TOUTES LES ROUTES NÉCESSITENT AUTHENTIFICATION ============

router.use(authenticateToken);

//============ ROUTES BROUILLONS ============

router.get('/drafts', privateStoriesController.getDrafts);
router.post('/draft', privateStoriesController.saveDraft);
router.put('/draft/:id', privateStoriesController.saveDraft);
router.get('/draft/:id', privateStoriesController.getDraftById);

//============ ROUTES HISTOIRES PUBLIÉES ============

router.get('/published', privateStoriesController.getPublishedStories);
router.post('/publish/:id', privateStoriesController.publishStory);

//============ ROUTES STATISTIQUES ============

router.get('/stats', privateStoriesController.getStats);

//============ ROUTES SUPPRESSION ============

router.delete('/story/:id', privateStoriesController.deleteStory);

module.exports = router;