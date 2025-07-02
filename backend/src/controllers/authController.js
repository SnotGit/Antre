const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    const { username, email, password, description } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email et password sont requis' 
      });
    }

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

    const hashedPassword = await bcrypt.hash(password, 10);

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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email et password sont requis' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Identifiants invalides' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Identifiants invalides' 
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'votre-secret-jwt-temporaire',
      { expiresIn: '7d' }
    );

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      description: user.description,
      role: user.role,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Connexion réussie',
      token: token,
      user: userData
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

const updateProfile = async (req, res) => {
  try {
    const { username, description } = req.body;
    const userId = req.user.userId;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ 
        error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' 
      });
    }

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
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Mot de passe actuel et nouveau mot de passe sont requis' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        error: 'Mot de passe actuel incorrect' 
      });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHashedPassword
      }
    });

    res.json({
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors du changement de mot de passe' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};