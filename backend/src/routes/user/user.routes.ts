const express = require('express');

//======= CONTROLLERS =======

const {
  getProfile,
  updateProfile,
  uploadAvatar
} = require('../controllers/user/profileController');

const {
  getStats
} = require('../controllers/user/statsController');

const {
  updateEmail,
  changePassword
} = require('../controllers/user/credentialsController');

const {
  getLikes,
  getTotalLikes,
  getStoryLikeStatus,
  toggleLike
} = require('../controllers/chroniques/likeController');

const { authenticateToken } = require('../controllers/authController');

const router = express.Router();

//======= USER ROUTES (PRIVATE) =======

const userRouter = express.Router();
userRouter.use(authenticateToken);

userRouter.get('/profile', getProfile);
userRouter.put('/profile', updateProfile);
userRouter.put('/email', updateEmail);
userRouter.put('/password', changePassword);
userRouter.post('/avatar', uploadAvatar);
userRouter.get('/stats', getStats);

router.use('/', userRouter);

//======= LIKES ROUTES =======

// Public routes
router.get('/likes/story/:id/count', getLikes);
router.get('/likes/user/:userId/total', getTotalLikes);
router.get('/likes/story/:id/status', getStoryLikeStatus);

// Private routes
router.post('/likes/story/:id/toggle', authenticateToken, toggleLike);

module.exports = router;