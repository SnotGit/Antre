const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

//======= CONSTANTS =======

const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  description: true,
  avatar: true,
  role: true,
  createdAt: true,
  playerId: true,
  playerDays: true
};

//======= MULTER CONFIG =======

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../../uploads/avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `avatar_${req.user.userId}_${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 200 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté'), false);
    }
  }
});

//======= GET PROFILE =======

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: USER_SELECT
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      message: 'Profil récupéré avec succès',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= UPDATE PROFILE =======

const updateProfile = [
  avatarUpload.single('avatar'),
  async (req, res) => {
    try {
      const { username, description, playerId, playerDays } = req.body;

      if (!username || username.trim().length < 3) {
        return res.status(400).json({ error: 'Nom d\'utilisateur requis (minimum 3 caractères)' });
      }

      const existingUser = await prisma.user.findFirst({
        where: { 
          username: username.trim(),
          NOT: { id: req.user.userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
      }

      const updateData = {
        username: username.trim(),
        description: description ? description.trim() : null,
        playerId: playerId ? playerId.trim() : null,
        playerDays: playerDays ? parseInt(playerDays) : null
      };

      if (req.file) {
        const user = await prisma.user.findUnique({
          where: { id: req.user.userId },
          select: { avatar: true }
        });

        if (user?.avatar) {
          const oldAvatarPath = path.join(__dirname, '../../../uploads', user.avatar);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        }

        updateData.avatar = `/avatars/${req.file.filename}`;
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.userId },
        data: updateData,
        select: USER_SELECT
      });

      res.json({
        message: 'Profil mis à jour avec succès',
        user: updatedUser
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
];

//======= EXPORTS =======

module.exports = {
  getProfile,
  updateProfile
};