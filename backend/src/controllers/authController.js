const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

//============ MIDDLEWARE AUTHENTIFICATION ============

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Token d\'accès requis' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt-temporaire', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Token invalide ou expiré' 
      });
    }

    req.user = user;
    next();
  });
};

//============ REGISTER ============

const register = async (req, res) => {
  try {
    const { username, email, password, description } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Nom d\'utilisateur, email et mot de passe sont requis' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Format d\'email invalide' 
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.trim() },
          { username: username.trim() }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Cet email ou nom d\'utilisateur est déjà utilisé' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim(),
        passwordHash: hashedPassword,
        description: description?.trim() || '',
        role: 'user'
      },
      select: {
        id: true,
        username: true,
        email: true,
        description: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Compte créé avec succès',
      user: newUser
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ LOGIN ============

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email et mot de passe sont requis' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim() }
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
      { userId: user.id, email: user.email, role: user.role },
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
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ VALIDATE TOKEN ============

const validateToken = async (req, res) => {
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
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ 
      message: 'Token valide',
      user 
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ EXPORTS ============

module.exports = {
  register,
  login,
  validateToken,
  authenticateToken
};