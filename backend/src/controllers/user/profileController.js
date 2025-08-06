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

//======= HELPERS =======

const handleError = (res, error) => {
  console.error(error);
  res.status(500).json({ error: 'Erreur serveur' });
};

const getUserField = async (userId, field) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { [field]: true }
  });
  
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }
  
  return { [field]: user[field] };
};

const updateUserField = async (userId, field, value, message) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { [field]: value },
    select: USER_SELECT
  });

  return {
    message,
    user: updatedUser
  };
};

const cleanupAvatar = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true }
  });

  if (user?.avatar) {
    const oldAvatarPath = path.join('uploads', user.avatar);
    if (fs.existsSync(oldAvatarPath)) {
      fs.unlinkSync(oldAvatarPath);
    }
  }
};

//======= AVATAR ENDPOINTS =======

const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    await cleanupAvatar(userId);
    
    const avatarUrl = `/avatars/${req.file.filename}`;
    const result = await updateUserField(userId, 'avatar', avatarUrl, 'Avatar mis à jour avec succès');
    
    res.json({ ...result, avatarUrl });

  } catch (error) {
    handleError(res, error);
  }
};

const getAvatar = async (req, res) => {
  try {
    const result = await getUserField(req.user.userId, 'avatar');
    res.json(result);
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      return res.status(404).json({ error: error.message });
    }
    handleError(res, error);
  }
};

const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    await cleanupAvatar(userId);
    
    const avatarUrl = `/avatars/${req.file.filename}`;
    const result = await updateUserField(userId, 'avatar', avatarUrl, 'Avatar mis à jour avec succès');
    
    res.json({ ...result, avatarUrl });

  } catch (error) {
    handleError(res, error);
  }
};

//======= USERNAME ENDPOINTS =======

const getUsername = async (req, res) => {
  try {
    const result = await getUserField(req.user.userId, 'username');
    res.json(result);
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      return res.status(404).json({ error: error.message });
    }
    handleError(res, error);
  }
};

const updateUsername = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username } = req.body;

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

    const result = await updateUserField(userId, 'username', username.trim(), 'Nom d\'utilisateur mis à jour avec succès');
    res.json(result);

  } catch (error) {
    handleError(res, error);
  }
};

//======= DESCRIPTION ENDPOINTS =======

const getDescription = async (req, res) => {
  try {
    const result = await getUserField(req.user.userId, 'description');
    res.json(result);
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      return res.status(404).json({ error: error.message });
    }
    handleError(res, error);
  }
};

const updateDescription = async (req, res) => {
  try {
    const { description } = req.body;
    const value = description ? description.trim() : null;
    
    const result = await updateUserField(req.user.userId, 'description', value, 'Description mise à jour avec succès');
    res.json(result);

  } catch (error) {
    handleError(res, error);
  }
};

//======= PLAYER ID ENDPOINTS =======

const getPlayerId = async (req, res) => {
  try {
    const result = await getUserField(req.user.userId, 'playerId');
    res.json(result);
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      return res.status(404).json({ error: error.message });
    }
    handleError(res, error);
  }
};

const updatePlayerId = async (req, res) => {
  try {
    const { playerId } = req.body;
    const value = playerId ? playerId.trim() : null;
    
    const result = await updateUserField(req.user.userId, 'playerId', value, 'ID Joueur mis à jour avec succès');
    res.json(result);

  } catch (error) {
    handleError(res, error);
  }
};

//======= PLAYER DAYS ENDPOINTS =======

const getPlayerDays = async (req, res) => {
  try {
    const result = await getUserField(req.user.userId, 'playerDays');
    res.json(result);
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      return res.status(404).json({ error: error.message });
    }
    handleError(res, error);
  }
};

const updatePlayerDays = async (req, res) => {
  try {
    const { playerDays } = req.body;
    const value = playerDays ? parseInt(playerDays) : null;
    
    const result = await updateUserField(req.user.userId, 'playerDays', value, 'Jours sur Mars mis à jour avec succès');
    res.json(result);

  } catch (error) {
    handleError(res, error);
  }
};

//======= EXPORTS =======

module.exports = {
  uploadAvatar: [upload.single('avatar'), uploadAvatar],
  getAvatar,
  updateAvatar: [upload.single('avatar'), updateAvatar],
  getUsername,
  updateUsername,
  getDescription,
  updateDescription,
  getPlayerId,
  updatePlayerId,
  getPlayerDays,
  updatePlayerDays
};