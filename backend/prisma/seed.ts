// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Hasher les mots de passe
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Créer Snot (ton compte admin)
  const snot = await prisma.user.upsert({
    where: { email: 'snot@antre.com' },
    update: {},
    create: {
      username: 'Snot',
      email: 'snot@antre.com',
      passwordHash: adminPassword,
      description: 'Créateur de L\'Antre - Maître des Chroniques',
      avatar: '/assets/images/writers/snot.jpg',
      role: 'admin',
    },
  });

  console.log('✅ Snot (admin) créé:', snot);

  // Créer Elena (utilisateur test)
  const elena = await prisma.user.upsert({
    where: { email: 'elena@test.com' },
    update: {},
    create: {
      username: 'Elena_Nova',
      email: 'elena@test.com',
      passwordHash: userPassword,
      description: 'Archéologue martienne',
      avatar: '/assets/images/writers/elena.jpg',
      role: 'user',
    },
  });

  console.log('✅ Elena (user test) créée:', elena);

  // Créer l'histoire d'Elena (exemple)
  const story = await prisma.story.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Les Glyphes de Cydonia',
      content: `Les excavations dans le secteur 7 de Cydonia n'avaient rien donné pendant des mois. La théorie du "visage sur Mars" avait été démystifiée depuis longtemps, mais quelque chose dans les formations géologiques de la région continuait d'intriguer les scientifiques.

C'est lors du carottage profond que nous avons découvert la première anomalie. À 47 mètres sous la surface, nos foreuses ont touché une matière différente, ni roche ni métal. Les échantillons remontés présentaient des motifs réguliers, presque géométriques, qui ne pouvaient pas être expliqués par des processus naturels.

Nous avons élargi la zone de forage et déployé des scanners souterrains. Les résultats ont laissé toute l'équipe sans voix. Une structure se dessinait sous nos pieds, enfouie depuis des millions d'années. Des chambres interconnectées, des couloirs... et partout, ces glyphes étranges.

Le Dr. Yamamoto a été le premier à suggérer qu'il pouvait s'agir d'une forme d'écriture. Je pensais qu'il exagérait, jusqu'à ce que je remarque les répétitions, les motifs... Une séquence mathématique précise. Nous avions découvert soit la preuve d'une intelligence extraterrestre ancienne, soit un phénomène géologique totalement inconnu. Dans les deux cas, l'histoire de Mars allait devoir être réécrite...`,
      userId: elena.id,
    },
  });

  console.log('✅ Histoire d\'Elena créée:', story);
  console.log('🎉 Seeding terminé avec succès !');
  console.log('📝 Connexions:');
  console.log('   Admin: snot@antre.com / admin123');
  console.log('   User:  elena@test.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });