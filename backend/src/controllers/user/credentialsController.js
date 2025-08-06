const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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

//======= HELPERS =======

const handleError = (res, error) => {
  console.error(error);
  res.status(500).json({ error: 'Erreur serveur' });
};

const validateEmail = (email) => {
  if (!email || !email.includes('@')) {
    return { valid: false, message: 'Email valide requis' };
  }
  return { valid: true };
};

const validatePassword = (currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    return { valid: false, message: 'Mots de passe requis' };
  }
  if (newPassword.length < 8) {
    return { valid: false, message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' };
  }
  return { valid: true };
};

//======= PUT /api/user/credentials/email =======

const updateEmail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { email } = req.body;

    const validation = validateEmail(email);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
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
      select: USER_SELECT
    });

    res.json({
      message: 'Email mis à jour avec succès',
      user: updatedUser
    });

  } catch (error) {
    handleError(res, error);
  }
};

//======= PUT /api/user/credentials/password =======

const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const validation = validatePassword(currentPassword, newPassword);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

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
    handleError(res, error);
  }
};

//======= EXPORTS =======

module.exports = {
  updateEmail,
  changePassword
};