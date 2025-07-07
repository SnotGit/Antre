const express = require('express');
const router = express.Router();
const privateStoriesController = require('../controllers/privateStoriesController');
const { authenticateToken } = require('../controllers/authController');

router.use(authenticateToken);

router.get('/stats', privateStoriesController.getStats);

router.get('/drafts', privateStoriesController.getDrafts);
router.post('/draft', privateStoriesController.saveDraft);
router.put('/draft/:id', privateStoriesController.saveDraft);
router.get('/draft/:id', privateStoriesController.getDraftById);

router.get('/published', privateStoriesController.getPublishedStories);
router.post('/publish/:id', privateStoriesController.publishStory);

router.get('/edit/:slug', privateStoriesController.getStoryForEdit);
router.get('/edit-published/:id', privateStoriesController.getPublishedForEdit);
router.post('/republish/:draftId', privateStoriesController.republishStory);

router.delete('/story/:id', privateStoriesController.deleteStory);

module.exports = router;