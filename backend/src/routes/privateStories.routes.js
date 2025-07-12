const express = require('express');
const router = express.Router();
const privateStoriesController = require('../controllers/privateStoriesController');
const { authenticateToken } = require('../controllers/authController');

router.use(authenticateToken);

router.get('/stats', privateStoriesController.getStats);

router.get('/drafts', privateStoriesController.getDrafts);
router.post('/draft', privateStoriesController.saveDraft);
router.put('/draft/:id', privateStoriesController.updateDraft);

router.get('/published', privateStoriesController.getPublishedStories);
router.post('/publish/:id', privateStoriesController.publishStory);

router.get('/edit/:id', privateStoriesController.getStoryForEdit);
router.post('/republish/:id', privateStoriesController.republishStory);

router.delete('/story/:id', privateStoriesController.deleteStory);

module.exports = router;