const express = require('express');
const { 
  getAllStories, 
  getStoryById, 
  createStory, 
  updateStory, 
  deleteStory,
  getStoriesByUser,
  likeStory,        
  getLikeStatus     
} = require('../controllers/storyController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Routes publiques (pas d'authentification requise)
router.get('/', getAllStories);                    
router.get('/:id', getStoryById);                  
router.get('/user/:userId', getStoriesByUser);     

// Routes protégées (authentification requise)
router.post('/', authenticateToken, createStory);               
router.put('/:id', authenticateToken, updateStory);             
router.delete('/:id', authenticateToken, deleteStory);          

// Routes pour le système de likes (authentifié)
router.post('/:id/like', authenticateToken, likeStory);         
router.get('/:id/like-status', authenticateToken, getLikeStatus); 

module.exports = router;