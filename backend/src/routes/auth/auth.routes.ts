import { Router } from 'express';
import { authenticateToken } from '@middlewares/auth/authenticateToken';
import { login } from '@controllers/auth/loginController';
import { validateToken } from '@controllers/auth/tokenController';

const router = Router();

//======= PUBLIC ROUTES =======

router.post('/login', login);

//======= PROTECTED ROUTES =======

router.get('/validate', authenticateToken, validateToken);

//======= TEST ROUTE =======

router.get('/test', authenticateToken, (req, res) => {
  res.json({
    message: 'Route auth protégée accessible !',
    user: req.user
  });
});

export default router;