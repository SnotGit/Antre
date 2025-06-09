const express = require('express');
const router = express.Router();
const chroniquesController = require('../controllers/chroniquesController');
const { authenticateToken } = require('../middleware/auth');

// Routes publiques (accessibles à tous)
router.get('/latest-stories', chroniquesController.getLatestStories);

// Routes protégées (authentification requise)
router.get('/drafts', authenticateToken, chroniquesController.getDrafts);
router.get('/published', authenticateToken, chroniquesController.getPublishedStories);
router.get('/total-likes', authenticateToken, chroniquesController.getTotalLikes);
router.post('/publish/:id', authenticateToken, chroniquesController.publishStory);
router.post('/like/:id', authenticateToken, chroniquesController.likeStory);
router.post('/draft', authenticateToken, chroniquesController.saveDraft);
router.put('/draft/:id', authenticateToken, chroniquesController.saveDraft);
router.get('/draft/:id', authenticateToken, chroniquesController.getDraftById);

module.exports = router;