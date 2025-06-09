const express = require('express');
const router = express.Router();
const chroniquesController = require('../controllers/chroniquesController');

router.get('/latest', chroniquesController.getLatestStories);
router.get('/drafts', chroniquesController.getDrafts);
router.get('/published', chroniquesController.getPublishedStories);
router.get('/total-likes', chroniquesController.getTotalLikes);
router.post('/publish/:id', chroniquesController.publishStory);
router.post('/like/:id', chroniquesController.likeStory);
router.post('/draft', chroniquesController.saveDraft);
router.put('/draft/:id', chroniquesController.saveDraft);
router.get('/draft/:id', chroniquesController.getDraftById);

module.exports = router;