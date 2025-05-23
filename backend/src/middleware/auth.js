// src/middleware/auth.js
const jwt = require('jsonwebtoken');

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
  // Récupérer le token depuis les headers
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      error: 'Token d\'accès requis' 
    });
  }

  // Vérifier le token
  jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt-temporaire', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Token invalide ou expiré' 
      });
    }

    // Ajouter les infos de l'utilisateur à la requête
    req.user = user;
    next();
  });
};

// Middleware pour vérifier le rôle admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentification requise' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Droits administrateur requis' 
    });
  }

  next();
};

// Middleware pour vérifier que l'utilisateur peut modifier ses propres données
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentification requise' 
    });
  }

  const resourceUserId = parseInt(req.params.userId) || parseInt(req.params.id);
  
  // Admin peut tout faire, ou l'utilisateur peut modifier ses propres données
  if (req.user.role === 'admin' || req.user.userId === resourceUserId) {
    next();
  } else {
    return res.status(403).json({ 
      error: 'Accès non autorisé' 
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin
};