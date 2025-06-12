const express = require('express');
const { 
  getAllStories, 
  getStoryById, 
  getStoryBySlug,
  createStory, 
  updateStory, 
  deleteStory,
  getStoriesByUser,
  likeStory,        
  getLikeStatus     
} = require('../controllers/storyController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

//============ ROUTES PUBLIQUES ============
router.get('/', getAllStories);                    
router.get('/user/:userId', getStoriesByUser);     
router.get('/slug/:slug', getStoryBySlug);
router.get('/:id', getStoryById);                  

//============ ROUTES PROTÉGÉES ============
router.post('/', authenticateToken, createStory);               
router.put('/:id', authenticateToken, updateStory);             
router.delete('/:id', authenticateToken, deleteStory);          

//============ ROUTES LIKES ============
router.post('/:id/like', authenticateToken, likeStory);         
router.get('/:id/like-status', authenticateToken, getLikeStatus); 

module.exports = router;