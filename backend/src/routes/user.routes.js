const express = require('express');
const { getProfile, updateProfile, updateEmail, uploadAvatar, changePassword } = require('../controllers/userController');
const { authenticateToken } = require('../controllers/authController');

const router = express.Router();

//============ TOUTES LES ROUTES NÉCESSITENT AUTHENTIFICATION ============

router.use(authenticateToken);

//============ GESTION PROFIL ============

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/email', updateEmail);

//============ GESTION AVATAR ============

router.post('/upload-avatar', uploadAvatar);

//============ GESTION MOT DE PASSE ============

router.put('/change-password', changePassword);

//============ ROUTE TEST ============

router.get('/test', (req, res) => {
  res.json({
    message: 'Route user protégée accessible !',
    user: req.user
  });
});

module.exports = router;