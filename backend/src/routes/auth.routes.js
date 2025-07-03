const express = require('express');
const { register, login, validateToken, authenticateToken } = require('../controllers/authController');

const router = express.Router();

//============ ROUTES PUBLIQUES ============

router.post('/register', register);
router.post('/login', login);

//============ ROUTES PROTÉGÉES ============

router.get('/validate', authenticateToken, validateToken);

//============ ROUTE TEST ============

router.get('/test', authenticateToken, (req, res) => {
  res.json({
    message: 'Route auth protégée accessible !',
    user: req.user
  });
});

module.exports = router;