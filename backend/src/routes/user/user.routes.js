const express = require('express');

//======= CONTROLLERS =======

const {
  getProfile,
  updateProfile,
  uploadAvatar
} = require('../../controllers/user/profileController');

const {
  getStats
} = require('../../controllers/user/statsController');

const {
  updateEmail,
  changePassword
} = require('../../controllers/user/credentialsController');

const {
  getLikes,
  getTotalLikes,
  getStoryLikeStatus,
  toggleLike
} = require('../../controllers/user/likeController');

const { authenticateToken } = require('../../controllers/auth/authController');

const router = express.Router();

//======= USER PROFILE ROUTES (PRIVATE) =======

router.get('/user/profile', authenticateToken, getProfile);
router.put('/user/profile', authenticateToken, updateProfile);
router.put('/user/email', authenticateToken, updateEmail);
router.put('/user/password', authenticateToken, changePassword);
router.post('/user/avatar', authenticateToken, uploadAvatar);
router.get('/user/stats', authenticateToken, getStats);

//======= USER LIKES ROUTES =======

// Public routes
router.get('/user/likes/story/:id/count', getLikes);
router.get('/user/likes/user/:userId/total', getTotalLikes);
router.get('/user/likes/story/:id/status', getStoryLikeStatus);

// Private routes
router.post('/user/likes/story/:id/toggle', authenticateToken, toggleLike);

module.exports = router;