// src/controllers/authController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Inscription
const register = async (req, res) => {
  try {
    const { username, email, password, description } = req.body;

    // Vérifications
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email et password sont requis' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Cet email ou username est déjà utilisé' 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        description: description || '',
        role: 'user'
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        description: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: newUser
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
};

// Connexion
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email et password sont requis' 
      });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        description: true,
        avatar: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Email ou mot de passe incorrect' 
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Email ou mot de passe incorrect' 
      });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'votre-secret-jwt-temporaire',
      { expiresIn: '24h' }
    );

    // Réponse complète
    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        description: user.description,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
};

// Profil utilisateur
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        description: true,
        avatar: true,
        role: true,
        createdAt: true,
        stories: {
          select: {
            id: true,
            title: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre à jour le profil utilisateur
const updateProfile = async (req, res) => {
  try {
    const { username, description } = req.body;
    const userId = req.user.userId;

    // Vérifications
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ 
        error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' 
      });
    }

    // Vérifier si le username est déjà pris (par un autre utilisateur)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Ce nom d\'utilisateur est déjà pris' 
      });
    }

    // Mettre à jour le profil
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username.trim(),
        description: description?.trim() || ''
      },
      select: {
        id: true,
        username: true,
        email: true,
        description: true,
        avatar: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });

  } catch (error) {
    console.error('Erreur update profile:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};