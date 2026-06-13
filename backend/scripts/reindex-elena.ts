import 'dotenv/config';
import { prisma } from '@db';
import { indexItem } from '@utils/elena/embeddings';
import { ELENA_SECTIONS, ElenaSection } from '@models/elena';

//======= RÉINDEXATION COMPLÈTE =======
// À lancer quand la formule d'embedding change (ex : ajout du nom de catégorie).
//   npx ts-node --require tsconfig-paths/register scripts/reindex-elena.ts

async function idsOf(section: ElenaSection): Promise<number[]> {
  if (section === 'marsball') return (await prisma.marsballItem.findMany({ select: { id: true } })).map(r => r.id);
  if (section === 'bestiaire') return (await prisma.bestiaireItem.findMany({ select: { id: true } })).map(r => r.id);
  if (section === 'rover') return (await prisma.roverItem.findMany({ select: { id: true } })).map(r => r.id);
  return (await prisma.terraformarsItem.findMany({ select: { id: true } })).map(r => r.id);
}

async function main(): Promise<void> {
  let total = 0;
  for (const section of ELENA_SECTIONS) {
    const ids = await idsOf(section);
    for (const id of ids) {
      await indexItem(section, id);
      console.log(`indexé ${section}#${id}`);
      total++;
    }
  }
  console.log(`Terminé : ${total} item(s) réindexé(s).`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
