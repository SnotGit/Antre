// src/controllers/uploadController.js
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Configuration de multer pour l'upload d'avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Utiliser un timestamp temporaire, on renommera après
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `temp-${timestamp}${extension}`;
    cb(null, filename);
  }
});

// Filtres pour les fichiers
const fileFilter = (req, file, cb) => {
  // Vérifier le type MIME
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'), false);
  }
};

// Configuration multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 // 500KB max
  }
});

// Contrôleur pour l'upload d'avatar - VERSION FINALE PROPRE
const uploadAvatar = async (req, res) => {
  try {
    // L'ID peut venir du token JWT OU du body (mode dev)
    const tokenUserId = req.user.userId;
    const requestedUserId = req.body.userId ? parseInt(req.body.userId) : tokenUserId;
    
    // Vérifier les permissions
    const tokenUser = await prisma.user.findUnique({
      where: { id: tokenUserId },
      select: { isDev: true, role: true }
    });

    // Si l'utilisateur demande l'upload pour quelqu'un d'autre, vérifier qu'il est dev
    if (requestedUserId !== tokenUserId) {
      if (!tokenUser || !tokenUser.isDev) {
        return res.status(403).json({ 
          error: 'Droits développeur requis pour modifier d\'autres utilisateurs' 
        });
      }
    }

    const userId = requestedUserId;

    if (!req.file) {
      return res.status(400).json({ 
        error: 'Aucun fichier fourni' 
      });
    }

    // Renommer le fichier avec le bon userId
    const timestamp = Date.now();
    const extension = path.extname(req.file.originalname);
    const newFilename = `user-${userId}-${timestamp}${extension}`;
    const oldPath = req.file.path;
    const newPath = path.join(path.dirname(oldPath), newFilename);
    
    // Renommer le fichier
    fs.renameSync(oldPath, newPath);

    // Supprimer l'ancien avatar s'il existe
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    if (currentUser?.avatar && !currentUser.avatar.includes('/assets/')) {
      const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(currentUser.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Chemin relatif pour la base de données
    const avatarPath = `/uploads/avatars/${newFilename}`;

    // Mettre à jour l'utilisateur CORRECT
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
      select: {
        id: true,
        username: true,
        email: true,
        description: true,
        avatar: true,
        role: true,
        isDev: true,
        createdAt: true
      }
    });

    res.json({
      message: 'Avatar mis à jour avec succès',
      user: updatedUser,
      avatarUrl: avatarPath
    });

  } catch (error) {
    console.error('Erreur upload avatar:', error);
    
    // Supprimer le fichier uploadé en cas d'erreur
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de l\'upload' });
  }
};

module.exports = {
  upload,
  uploadAvatar
};