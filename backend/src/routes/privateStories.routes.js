const express = require('express');
const router = express.Router();
const privateStoriesController = require('../controllers/privateStoriesController');
const { authenticateToken } = require('../controllers/authController');

//============ MIDDLEWARE GLOBAL ============

router.use(authenticateToken);

//============ RÉSOLUTION ============

router.get('/resolve/:title', privateStoriesController.resolveTitle);

//============ ÉDITION ============

router.get('/edit/:id', privateStoriesController.getStoryForEdit);

//============ CRUD ============

router.post('/draft', privateStoriesController.createDraft);
router.put('/draft/:id', privateStoriesController.updateDraft);

//============ PUBLICATION ============

router.post('/publish/:id', privateStoriesController.publishStory);
router.post('/update/:id', privateStoriesController.updateOriginalStory);

//============ SUPPRESSION UNIFIÉE ============

router.delete('/story/:id', privateStoriesController.deleteStory); 

//============ LISTES ============

router.get('/stats', privateStoriesController.getStats);
router.get('/drafts', privateStoriesController.getDrafts);
router.get('/published', privateStoriesController.getPublishedStories);

//============ LIKES ============

router.post('/story/:id/like', privateStoriesController.toggleLike);

module.exports = router;