// src/routes/chroniques.js
const express = require('express');
const { 
  getUserDrafts,
  getUserPublishedStories,
  getUserTotalLikes, // NOUVEAU
  publishStory,
  likeStory,
  archiveStory,
  saveDraft,
  getDraftById,
  getRecentAuthors
} = require('../controllers/chroniquesController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Routes publiques
router.get('/recent-authors', getRecentAuthors);                           // GET /api/chroniques/recent-authors

// Routes protégées (authentification requise)
router.get('/drafts', authenticateToken, getUserDrafts);                    // GET /api/chroniques/drafts
router.get('/drafts/:id', authenticateToken, getDraftById);                // GET /api/chroniques/drafts/1
router.post('/drafts', authenticateToken, saveDraft);                      // POST /api/chroniques/drafts (nouveau)
router.put('/drafts/:id', authenticateToken, saveDraft);                   // PUT /api/chroniques/drafts/1 (mise à jour)

router.get('/published', authenticateToken, getUserPublishedStories);      // GET /api/chroniques/published
router.get('/my-likes-count', authenticateToken, getUserTotalLikes);       // GET /api/chroniques/my-likes-count - NOUVEAU
router.put('/:id/publish', authenticateToken, publishStory);               // PUT /api/chroniques/1/publish
router.put('/:id/archive', authenticateToken, archiveStory);               // PUT /api/chroniques/1/archive

// Routes publiques pour les interactions
router.post('/:id/like', authenticateToken, likeStory);                    // POST /api/chroniques/1/like

module.exports = router;