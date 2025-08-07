const express = require('express');

//======= CONTROLLERS =======

const {
  uploadAvatar,
  getAvatar,
  updateAvatar,
  getUsername,
  updateUsername,
  getDescription,
  updateDescription,
  getPlayerId,
  updatePlayerId,
  getPlayerDays,
  updatePlayerDays
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

router.post('/profile/avatar', authenticateToken, uploadAvatar);
router.get('/profile/avatar', authenticateToken, getAvatar);
router.put('/profile/avatar', authenticateToken, updateAvatar);

router.get('/profile/username', authenticateToken, getUsername);
router.put('/profile/username', authenticateToken, updateUsername);

router.get('/profile/description', authenticateToken, getDescription);
router.put('/profile/description', authenticateToken, updateDescription);

router.get('/profile/playerId', authenticateToken, getPlayerId);
router.put('/profile/playerId', authenticateToken, updatePlayerId);

router.get('/profile/playerDays', authenticateToken, getPlayerDays);
router.put('/profile/playerDays', authenticateToken, updatePlayerDays);

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