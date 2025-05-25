// src/routes/stories.js
const express = require('express');
const { 
  getAllStories, 
  getStoryById, 
  createStory, 
  updateStory, 
  deleteStory,
  getStoriesByUser 
} = require('../controllers/storyController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Routes publiques (pas d'authentification requise)
router.get('/', getAllStories);                    // GET /api/stories
router.get('/:id', getStoryById);                  // GET /api/stories/1
router.get('/user/:userId', getStoriesByUser);     // GET /api/stories/user/1

// Routes protégées (authentification requise)
router.post('/', authenticateToken, createStory);               // POST /api/stories
router.put('/:id', authenticateToken, updateStory);             // PUT /api/stories/1
router.delete('/:id', authenticateToken, deleteStory);          // DELETE /api/stories/1

module.exports = router;