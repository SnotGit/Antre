const express = require('express');
const router = express.Router();
const publicStoriesController = require('../controllers/publicStoriesController');

//============ MIDDLEWARE AUTH OPTIONNEL ============

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

router.get('/user/:id/stories', publicStoriesController.getUserStories);

router.get('/user/:id/profile', publicStoriesController.getUserProfile);

//============ ROUTES RÉSOLUTION ============

router.get('/resolve/:username', publicStoriesController.resolveUsername);

router.get('/resolve/:username/:title', publicStoriesController.resolveStory);

module.exports = router;