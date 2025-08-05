const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

//======= MULTER CONFIG =======

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = 'uploads/avatars';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.userId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});

//======= GET PROFILE =======

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
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ 
      message: 'Profil récupéré',
      user 
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= UPDATE PROFILE =======

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, description, playerId, playerDays } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'Nom d\'utilisateur requis (minimum 3 caractères)' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { 
        username: username.trim(),
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
    }

    const updateData = {
      username: username.trim(),
      description: description ? description.trim() : null
    };

    if (playerId !== undefined) {
      updateData.playerId = playerId ? playerId.trim() : null;
    }
    if (playerDays !== undefined) {
      updateData.playerDays = playerDays ? parseInt(playerDays) : null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        description: true,
        avatar: true,
        role: true,
        createdAt: true,
        playerId: true,
        playerDays: true
      }
    });

    res.json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= UPLOAD AVATAR =======

const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user.avatar) {
      const oldAvatarPath = path.join('uploads', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    const avatarUrl = `/avatars/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
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
      message: 'Avatar mis à jour avec succès',
      user: updatedUser,
      avatarUrl: avatarUrl
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= EXPORTS =======

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar: [upload.single('avatar'), uploadAvatar]
};