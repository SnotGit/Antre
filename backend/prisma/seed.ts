// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

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

  // Créer Elena Nova (utilisatrice test)
  const elena = await prisma.user.upsert({
    where: { email: 'elena@test.com' },
    update: {},
    create: {
      username: 'Elena Nova',
      email: 'elena@test.com',
      passwordHash: userPassword,
      description: 'Archéologue martienne.',
      avatar: '/assets/images/Avatar-test.png',
      role: 'user',
    },
  });

  console.log('✅ Elena Nova (user test) créée:', elena);

  // Histoires d'Elena Nova
  const stories = [
    // Histoire publiée 1
    {
      title: 'Les Glyphes de Cydonia',
      content: `Les excavations dans le secteur 7 de Cydonia n'avaient rien donné pendant des mois. La théorie du "visage sur Mars" avait été démystifiée depuis longtemps, mais quelque chose dans les formations géologiques de la région continuait d'intriguer les scientifiques.

C'est lors du carottage profond que nous avons découvert la première anomalie. À 47 mètres sous la surface, nos foreuses ont touché une matière différente, ni roche ni métal. Les échantillons remontés présentaient des motifs réguliers, presque géométriques, qui ne pouvaient pas être expliqués par des processus naturels.

Nous avons élargi la zone de forage et déployé des scanners souterrains. Les résultats ont laissé toute l'équipe sans voix. Une structure se dessinait sous nos pieds, enfouie depuis des millions d'années. Des chambres interconnectées, des couloirs... et partout, ces glyphes étranges.

Le Dr. Yamamoto a été le premier à suggérer qu'il pouvait s'agir d'une forme d'écriture. Je pensais qu'il exagérait, jusqu'à ce que je remarque les répétitions, les motifs... Une séquence mathématique précise. Nous avions découvert soit la preuve d'une intelligence extraterrestre ancienne, soit un phénomène géologique totalement inconnu. Dans les deux cas, l'histoire de Mars allait devoir être réécrite...`,
      status: 'PUBLISHED',
      publishedAt: new Date('2025-01-15'),
      views: 147,
    },
    
    // Histoire publiée 2
    {
      title: 'Tempête sur Olympus Mons',
      content: `La saison des tempêtes était arrivée plus tôt que prévu cette année. Les vents de poussière rouge balayaient déjà les flancs d'Olympus Mons quand nous avons reçu l'ordre d'évacuation d'urgence de la station de recherche.

"Nous avons peut-être vingt minutes avant que la visibilité soit nulle", a crié le Dr. Chen par-dessus le hurlement du vent. Les instruments météorologiques affichaient des vitesses dépassant les 200 km/h – du jamais vu à cette altitude.

Mais quelque chose clochait. Cette tempête ne suivait pas les modèles habituels. Elle semblait... organisée. Comme si elle avait une intelligence propre. Les relevés sismiques montraient des vibrations anormales venant du cœur du volcan éteint.

Alors que nous rassemblions nos équipements essentiels, j'ai aperçu quelque chose d'impossible à travers le nuage de poussière rouge : une lueur bleue, pulsante, émanant des profondeurs d'Olympus Mons. Cette découverte allait changer notre compréhension de Mars pour toujours...`,
      status: 'PUBLISHED',
      publishedAt: new Date('2025-01-08'),
      views: 89,
    },

    // Histoire publiée 3
    {
      title: 'Le Signal de Phobos',
      content: `Phobos avait toujours été notre lune silencieuse, un rocher déformé gravitant autour de Mars en 7 heures et 39 minutes. Jusqu'à ce mardi de l'an 2387.

J'étais de garde au centre de communications quand les premiers signaux sont arrivés. Des impulsions radio régulières, espacées de exactement 1,618 seconde – le nombre d'or. Impossible que ce soit un hasard.

"Houston, nous avons un problème", ai-je murmuré dans mon micro, reprenant malgré moi la célèbre phrase. Mais cette fois, le problème ne venait pas de nous.

Les signaux provenaient de l'intérieur de Phobos. Nos sondes n'avaient jamais détecté de structures creuses dans ce satellite. Pourtant, quelque chose émettait depuis son noyau. Quelque chose qui connaissait nos mathématiques.

Le commandant Torres a pris la décision : mission d'exploration immédiate vers Phobos. Nous allions être les premiers humains à poser le pied sur cette lune mystérieuse. Ce que nous y avons découvert a changé notre vision de l'univers...`,
      status: 'PUBLISHED',
      publishedAt: new Date('2024-12-28'),
      views: 203,
    },

    // Brouillon 1
    {
      title: 'Les Dômes Perdus',
      content: `Les colonies perdues du secteur Gamma restent l'un des plus grands mystères de l'exploration martienne. Selon les archives, treize dômes d'habitation avaient été établis dans cette région en 2341, abritant plus de mille colons.

Puis, du jour au lendemain, plus rien. Les communications se sont tues. Les satellites ne détectaient plus aucune activité. Quand les équipes de secours sont arrivées trois mois plus tard, ils ont trouvé les dômes intacts mais vides. Pas de corps, pas de signes de lutte, pas d'explications.

J'ai passé les six derniers mois à analyser les dernières transmissions de ces colonies. Il y a des indices troublants : des mentions de "lumières dans le sous-sol", de "chuchotements dans les conduits d'aération", de "formes mouvantes dans la brume matinale"...

[BROUILLON - Suite à développer : investigation sur le terrain, découverte des tunnels souterrains, rencontre avec... quelque chose]`,
      status: 'DRAFT',
    },

    // Brouillon 2
    {
      title: '',
      content: `Notes pour nouvelle histoire :
      
- Exploration des canyons de Valles Marineris
- Découverte d'un écosystème souterrain impossible
- Formes de vie adaptées à l'environnement martien ?
- Conflit avec les directives de non-interférence
- Dilemme éthique : révéler la découverte ou protéger les créatures ?

Personnages :
- Dr. Sarah Chen, biologiste
- Marcus Rodriguez, géologue  
- IA de bord "Athena"

Début possible : "Les profondeurs de Valles Marineris gardaient leurs secrets depuis des milliards d'années. Nous étions sur le point de violer ce silence éternel..."`,
      status: 'DRAFT',
    },

    // Brouillon 3
    {
      title: 'Révolte dans les Mines',
      content: `L'exploitation minière de Chryse Planitia était censée être notre ticket vers l'indépendance énergétique. Les gisements de deutérium découverts en profondeur promettaient de révolutionner les voyages interplanétaires.

Mais le coût humain devenait de plus en plus lourd. Les mineurs travaillaient dans des conditions extrêmes, exposés aux radiations, à la poussière toxique, aux effondrements. La Corporate pensait pouvoir les exploiter indéfiniment.

Elle avait tort.

Tout a commencé quand Jake Morrison est mort dans l'effondrement du tunnel 7. Officiellement, "accident industriel". Officieusement, nous savions tous que les mesures de sécurité avaient été négligées pour respecter les quotas de production.

C'est cette nuit-là que nous avons décidé de prendre les choses en main. Si la Corporation ne voulait pas écouter nos revendications, nous allions la forcer à nous entendre. Mars était notre monde maintenant, et nous n'allions plus accepter d'être traités comme des esclaves...

[En cours de rédaction - Développer la planification de la révolte, les personnages clés, l'escalade du conflit]`,
      status: 'DRAFT',
    }
  ];

  // Créer les histoires d'Elena
  for (let i = 0; i < stories.length; i++) {
    const storyData = stories[i];
    const wordCount = countWords(storyData.content);
    
    await prisma.story.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        title: storyData.title,
        content: storyData.content,
        status: storyData.status as 'DRAFT' | 'PUBLISHED',
        publishedAt: storyData.publishedAt,
        views: storyData.views || 0,
        wordCount: wordCount,
        userId: elena.id,
      },
    });
  }

  // Créer quelques likes pour les histoires publiées (depuis Snot)
  const publishedStories = await prisma.story.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true }
  });

  for (const story of publishedStories) {
    await prisma.like.upsert({
      where: {
        userId_storyId: {
          userId: snot.id,
          storyId: story.id
        }
      },
      update: {},
      create: {
        userId: snot.id,
        storyId: story.id
      }
    });
  }

  console.log('✅ Histoires d\'Elena Nova créées');
  console.log('✅ Likes ajoutés par Snot');
  console.log('🎉 Seeding terminé avec succès !');
  console.log('📝 Connexions:');
  console.log('   Admin: snot@antre.com / admin123');
  console.log('   User:  elena@test.com / user123');
  console.log('📊 Données créées:');
  console.log(`   - 3 histoires publiées par Elena`);
  console.log(`   - 3 brouillons par Elena`);
  console.log(`   - Likes de Snot sur toutes les histoires publiées`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });