// Test direct authentification - backend/test-auth.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🔍 TEST DIRECT AUTHENTIFICATION\n');
    
    // 1. Tester la base de données
    console.log('1️⃣ Test connexion base de données...');
    const userCount = await prisma.user.count();
    console.log(`✅ ${userCount} utilisateurs en base\n`);
    
    // 2. Récupérer snot@antre.com
    console.log('2️⃣ Recherche snot@antre.com...');
    const user = await prisma.user.findUnique({
      where: { email: 'snot@antre.com' },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        role: true
      }
    });

    if (!user) {
      console.log('❌ snot@antre.com NON TROUVÉ dans la base !');
      console.log('\n📝 Emails disponibles :');
      const allUsers = await prisma.user.findMany({
        select: { email: true, username: true, role: true }
      });
      allUsers.forEach(u => console.log(`   ${u.email} (${u.username}) - ${u.role}`));
      return;
    }

    console.log(`✅ Utilisateur trouvé :`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Hash: ${user.passwordHash.substring(0, 30)}...`);
    
    // 3. Tester différents mots de passe
    console.log('\n3️⃣ Test des mots de passe...');
    const passwords = ['Admin@124', 'User@124', 'admin', 'password', 'snot', '123456'];
    
    let foundPassword = null;
    for (const pwd of passwords) {
      const isValid = await bcrypt.compare(pwd, user.passwordHash);
      console.log(`${isValid ? '✅' : '❌'} "${pwd}"`);
      if (isValid) {
        foundPassword = pwd;
        break;
      }
    }
    
    if (foundPassword) {
      console.log(`\n🎉 MOT DE PASSE TROUVÉ : "${foundPassword}"`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Password: ${foundPassword}`);
    } else {
      console.log('\n❌ AUCUN MOT DE PASSE NE FONCTIONNE !');
      console.log('\n🔧 Réinitialisation du mot de passe...');
      
      const newPassword = user.role === 'admin' ? 'Admin@124' : 'User@124';
      const newHash = await bcrypt.hash(newPassword, 10);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash }
      });
      
      console.log(`✅ Nouveau mot de passe défini : ${newPassword}`);
      
      // Vérifier que ça marche
      const testNew = await bcrypt.compare(newPassword, newHash);
      console.log(`🧪 Test nouveau mot de passe : ${testNew ? '✅ OK' : '❌ ERREUR'}`);
    }
    
    // 4. Vérifier les variables d'environnement
    console.log('\n4️⃣ Variables d\'environnement...');
    console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Défini' : '❌ Manquant'}`);
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Défini' : '❌ Manquant'}`);
    
  } catch (error) {
    console.error('❌ ERREUR :', error.message);
    console.log('\n💡 Vérifiez :');
    console.log('   - Le serveur PostgreSQL est démarré');
    console.log('   - Le fichier .env existe');
    console.log('   - Les variables DATABASE_URL et JWT_SECRET sont définies');
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();