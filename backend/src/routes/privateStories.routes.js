const express = require('express');
const router = express.Router();
const privateStoriesController = require('../controllers/privateStoriesController');
const { authenticateToken } = require('../controllers/authController');

//============ MIDDLEWARE GLOBAL ============

router.use(authenticateToken);

//============ STATISTIQUES ============

router.get('/stats', privateStoriesController.getStats);

//============ LISTES ============

router.get('/drafts', privateStoriesController.getDrafts);
router.get('/published', privateStoriesController.getPublishedStories);

//============ CRÉATION/MODIFICATION ============

router.post('/draft', privateStoriesController.saveDraft);
router.put('/draft/:id', privateStoriesController.updateDraft);

//============ PUBLICATION ============

router.post('/publish/:id', privateStoriesController.publishStory);
router.post('/republish/:id', privateStoriesController.republishStory);

//============ ÉDITION ============

router.get('/edit/:id', privateStoriesController.getStoryForEdit);

//============ SUPPRESSION ============

router.delete('/cancel/:id', privateStoriesController.cancelNewStory);
router.delete('/draft/:id', privateStoriesController.deleteDraft);
router.delete('/published/:id', privateStoriesController.deletePublished);

//============ LIKES ============

router.post('/story/:id/like', privateStoriesController.toggleLike);

module.exports = router;