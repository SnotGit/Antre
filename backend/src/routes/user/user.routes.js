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

//======= USER PROFILE ROUTES (PRIVATE) =======

router.post('/user/profile/avatar', authenticateToken, uploadAvatar);
router.get('/user/profile/avatar', authenticateToken, getAvatar);
router.put('/user/profile/avatar', authenticateToken, updateAvatar);

router.get('/user/profile/username', authenticateToken, getUsername);
router.put('/user/profile/username', authenticateToken, updateUsername);

router.get('/user/profile/description', authenticateToken, getDescription);
router.put('/user/profile/description', authenticateToken, updateDescription);

router.get('/user/profile/playerId', authenticateToken, getPlayerId);
router.put('/user/profile/playerId', authenticateToken, updatePlayerId);

router.get('/user/profile/playerDays', authenticateToken, getPlayerDays);
router.put('/user/profile/playerDays', authenticateToken, updatePlayerDays);

//======= USER CREDENTIALS ROUTES (PRIVATE) =======

router.put('/user/credentials/email', authenticateToken, updateEmail);
router.put('/user/credentials/password', authenticateToken, changePassword);

//======= USER STATS ROUTES (PRIVATE) =======

router.get('/user/stats', authenticateToken, getStats);

//======= USER LIKES ROUTES =======

router.get('/user/likes/story/:id/count', getLikes);
router.get('/user/likes/user/:userId/total', getTotalLikes);
router.get('/user/likes/story/:id/status', getStoryLikeStatus);
router.post('/user/likes/story/:id/toggle', authenticateToken, toggleLike);

module.exports = router;