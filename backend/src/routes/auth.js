const express = require('express');
const { register, login, getProfile, updateProfile, changePassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { upload, uploadAvatar } = require('../controllers/uploadController');

const router = express.Router();

// Routes publiques (pas besoin d'authentification)
router.post('/register', register);
router.post('/login', login);

// Routes protégées (authentification requise)
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

// Upload avatar
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), uploadAvatar);

// Route de test pour vérifier l'authentification
router.get('/test', authenticateToken, (req, res) => {
  res.json({
    message: 'Route protégée accessible !',
    user: req.user
  });
});

module.exports = router;