// src/routes/auth.js
const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Routes publiques (pas besoin d'authentification)
router.post('/register', register);
router.post('/login', login);

// Routes protégées (authentification requise)
router.get('/profile', authenticateToken, getProfile);

// Route pour récupérer les utilisateurs de développement
router.get('/dev-users', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur actuel a le droit d'accéder au mode dev
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isDev: true, role: true }
    });

    if (!currentUser || !currentUser.isDev) {
      return res.status(403).json({ 
        error: 'Accès mode développement non autorisé' 
      });
    }

    // Récupérer tous les utilisateurs avec isDev = true
    const devUsers = await prisma.user.findMany({
      where: { isDev: true },
      select: {
        id: true,
        username: true,
        email: true,
        description: true,
        avatar: true,
        role: true,
        isDev: true,
        createdAt: true
      },
      orderBy: { role: 'asc' } // admin d'abord, puis user
    });
    
    res.json({ 
      message: 'Utilisateurs dev récupérés avec succès',
      users: devUsers 
    });

  } catch (error) {
    console.error('Erreur récupération utilisateurs dev:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de test pour vérifier l'authentification
router.get('/test', authenticateToken, (req, res) => {
  res.json({
    message: 'Route protégée accessible !',
    user: req.user
  });
});

module.exports = router;