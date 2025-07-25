const express = require('express');
const router = express.Router();
const privateStoriesController = require('../controllers/privateStoriesController');
const { authenticateToken } = require('../controllers/authController');

//============ MIDDLEWARE GLOBAL ============

router.use(authenticateToken);

//============ RÉSOLUTION ============

router.get('/resolve/:title', privateStoriesController.resolveTitle);

//============ LOADING ============

router.get('/story/draft/:id', privateStoriesController.loadDraft);
router.get('/story/published/:id', privateStoriesController.loadPublishedToDraft);

//============ CRUD ============

router.post('/story/draft', privateStoriesController.createDraft);
router.put('/story/draft/:id', privateStoriesController.updateDraft);

//============ PUBLICATION ============

router.post('/story/publish/:id', privateStoriesController.publishStory);
router.post('/story/update/:id', privateStoriesController.updateOriginal);

//============ SUPPRESSION ============

router.delete('/story/cancel/:id', privateStoriesController.deleteStory);
router.delete('/story/draft/:id', privateStoriesController.deleteStory);

//============ LISTES ============

router.get('/stats', privateStoriesController.getStats);
router.get('/drafts', privateStoriesController.getDrafts);
router.get('/published', privateStoriesController.getPublished);

//============ LIKES ============

router.post('/story/:id/like', privateStoriesController.toggleLike);

module.exports = router;