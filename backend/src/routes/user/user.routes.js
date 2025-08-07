const express = require('express');

//======= CONTROLLERS =======

const {
  getProfile,
  updateProfile
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

//======= USER PROFILE ROUTES =======

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

//======= USER CREDENTIALS ROUTES =======

router.put('/credentials/email', authenticateToken, updateEmail);
router.put('/credentials/password', authenticateToken, changePassword);

//======= USER STATS ROUTES =======

router.get('/stats', authenticateToken, getStats);

//======= USER LIKES ROUTES =======

router.get('/likes/story/:id/count', getLikes);
router.get('/likes/user/:userId/total', getTotalLikes);
router.get('/likes/story/:id/status', getStoryLikeStatus);
router.post('/likes/story/:id/toggle', authenticateToken, toggleLike);

module.exports = router;