const express = require('express');
const router = express.Router();
const publicStoriesController = require('../controllers/publicStoriesController');
const { authenticateToken } = require('../controllers/authController');

//============ MIDDLEWARE AUTH ============

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt-temporaire', (err, user) => {
    req.user = err ? null : user;
    next();
  });
};

//============ ROUTES PRINCIPALES ============

router.get('/stories', publicStoriesController.getLatestStories);

router.get('/story/:id', optionalAuth, publicStoriesController.getStoryById);

router.get('/username/:username/stories', publicStoriesController.getUsernameStories);

//============ ROUTES RÉSOLUTION ============

router.get('/resolve/:username/:title', publicStoriesController.resolveStory);

router.get('/resolve/username/:username', publicStoriesController.resolveUsername);

//============ ROUTES LEGACY (compatibilité) ============

router.get('/story/:username/:title', optionalAuth, publicStoriesController.getStoryByUsernameAndTitle);

router.get('/users/:id', publicStoriesController.getUserProfile);

module.exports = router;