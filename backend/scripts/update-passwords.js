const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updatePasswords() {
  try {
    // Hash des nouveaux mots de passe
    const adminHash = await bcrypt.hash('Admin@124', 10);
    const userHash = await bcrypt.hash('User@124', 10);

    // Mise à jour admin (sulfuro)
    await prisma.user.updateMany({
      where: {
        role: 'admin'
      },
      data: {
        passwordHash: adminHash
      }
    });

    // Mise à jour user (zeldator)
    await prisma.user.updateMany({
      where: {
        role: 'user'
      },
      data: {
        passwordHash: userHash
      }
    });

    console.log('✅ Mots de passe mis à jour avec succès !');
    console.log('Admin (sulfuro): Admin@124');
    console.log('User (zeldator): User@124');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePasswords();