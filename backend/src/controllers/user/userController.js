const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

//======= MULTER CONFIG =======

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
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
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
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
    const { username, description } = req.body;

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

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username.trim(),
        description: description ? description.trim() : null
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
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= UPDATE EMAIL =======

const updateEmail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email valide requis' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { 
        email: email.trim(),
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email: email.trim() },
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
      message: 'Email mis à jour avec succès',
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= CHANGE PASSWORD =======

const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mots de passe requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const bcrypt = require('bcrypt');
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({ message: 'Mot de passe modifié avec succès' });

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

    // Supprimer l'ancien avatar s'il existe
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

//======= GET STATS =======

const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const draftsCount = await prisma.story.count({
      where: { 
        userId: userId,
        status: 'DRAFT' 
      }
    });

    const publishedCount = await prisma.story.count({
      where: { 
        userId: userId,
        status: 'PUBLISHED' 
      }
    });

    const totalLikes = await prisma.like.count({
      where: {
        story: {
          userId: userId,
          status: 'PUBLISHED'
        }
      }
    });

    const stats = {
      drafts: draftsCount,
      published: publishedCount,
      totalLikes: totalLikes
    };

    res.json({ stats });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= EXPORTS =======

module.exports = {
  getProfile,
  updateProfile,
  updateEmail,
  changePassword,
  uploadAvatar: [upload.single('avatar'), uploadAvatar],
  getStats
};