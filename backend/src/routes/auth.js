const express = require('express');
const { register, login, validateToken } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

//============ ROUTES PUBLIQUES ============

router.post('/register', register);
router.post('/login', login);

//============ ROUTES PROTÉGÉES ============

router.get('/validate', authenticateToken, validateToken);

//============ ROUTE TEST ============

router.get('/test', authenticateToken, (req, res) => {
  res.json({
    message: 'Route protégée accessible !',
    user: req.user
  });
});

module.exports = router;