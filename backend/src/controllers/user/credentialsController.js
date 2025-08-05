const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

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
        createdAt: true,
        playerId: true,
        playerDays: true
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

//======= EXPORTS =======

module.exports = {
  updateEmail,
  changePassword
};