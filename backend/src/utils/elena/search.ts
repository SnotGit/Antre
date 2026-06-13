import { prisma } from '@db';
import { ElenaSection } from '@models/elena';

//======= NORMALISATION (comparaison lexicale uniquement, jamais pour les embeddings) =======
// Miroir de la fonction SQL elena_normalize : lower, sans accents, apostrophes/tirets -> espaces.

export function normalizeLexical(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

//======= MATCH CATÉGORIES (le nom contient le terme) =======

export interface CategoryMatch {
  section: ElenaSection;
  id: number;
  title: string;
  itemCount: number;
}

export async function findCategoryMatches(termNorm: string): Promise<CategoryMatch[]> {
  const select = { id: true, title: true, _count: { select: { items: true } } };

  const [marsball, bestiaire, rover, terraformars] = await Promise.all([
    prisma.marsballCategory.findMany({ select }),
    prisma.bestiaireCategory.findMany({ select }),
    prisma.roverCategory.findMany({ select }),
    prisma.terraformarsCategory.findMany({ select })
  ]);

  const all: CategoryMatch[] = [
    ...marsball.map(c => ({ section: 'marsball' as ElenaSection, id: c.id, title: c.title, itemCount: c._count.items })),
    ...bestiaire.map(c => ({ section: 'bestiaire' as ElenaSection, id: c.id, title: c.title, itemCount: c._count.items })),
    ...rover.map(c => ({ section: 'rover' as ElenaSection, id: c.id, title: c.title, itemCount: c._count.items })),
    ...terraformars.map(c => ({ section: 'terraformars' as ElenaSection, id: c.id, title: c.title, itemCount: c._count.items }))
  ];

  return all.filter(c => normalizeLexical(c.title).includes(termNorm));
}

//======= MATCH ITEMS (le titre OU la description contient le terme) =======
// SQL via elena_normalize : insensible aux accents/casse, scalable (vs charger tout en JS).

interface RawItem {
  id: number;
  title: string;
  description: string | null;
  categoryId: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  categoryTitle: string;
}

export interface ItemMatch extends RawItem {
  section: ElenaSection;
}

export async function findItemMatches(termNorm: string): Promise<ItemMatch[]> {
  const pattern = `%${termNorm}%`;

  const [marsball, bestiaire, rover, terraformars] = await Promise.all([
    prisma.$queryRaw<RawItem[]>`
      SELECT i.id, i.title, i.description, i.category_id AS "categoryId",
             i.image_url AS "imageUrl", i.thumbnail_url AS "thumbnailUrl", c.title AS "categoryTitle"
      FROM marsball_items i JOIN marsball_categories c ON c.id = i.category_id
      WHERE elena_normalize(i.title) LIKE ${pattern} OR elena_normalize(coalesce(i.description, '')) LIKE ${pattern}`,
    prisma.$queryRaw<RawItem[]>`
      SELECT i.id, i.title, i.description, i.category_id AS "categoryId",
             i.image_url AS "imageUrl", i.thumbnail_url AS "thumbnailUrl", c.title AS "categoryTitle"
      FROM bestiaire_items i JOIN bestiaire_categories c ON c.id = i.category_id
      WHERE elena_normalize(i.title) LIKE ${pattern} OR elena_normalize(coalesce(i.description, '')) LIKE ${pattern}`,
    prisma.$queryRaw<RawItem[]>`
      SELECT i.id, i.title, i.description, i.category_id AS "categoryId",
             i.image_url AS "imageUrl", i.thumbnail_url AS "thumbnailUrl", c.title AS "categoryTitle"
      FROM rover_items i JOIN rover_categories c ON c.id = i.category_id
      WHERE elena_normalize(i.title) LIKE ${pattern} OR elena_normalize(coalesce(i.description, '')) LIKE ${pattern}`,
    prisma.$queryRaw<RawItem[]>`
      SELECT i.id, i.title, i.description, i.category_id AS "categoryId",
             i.image_url AS "imageUrl", i.thumbnail_url AS "thumbnailUrl", c.title AS "categoryTitle"
      FROM terraformars_items i JOIN terraformars_categories c ON c.id = i.category_id
      WHERE elena_normalize(i.title) LIKE ${pattern} OR elena_normalize(coalesce(i.description, '')) LIKE ${pattern}`
  ]);

  return [
    ...marsball.map(i => ({ ...i, section: 'marsball' as ElenaSection })),
    ...bestiaire.map(i => ({ ...i, section: 'bestiaire' as ElenaSection })),
    ...rover.map(i => ({ ...i, section: 'rover' as ElenaSection })),
    ...terraformars.map(i => ({ ...i, section: 'terraformars' as ElenaSection }))
  ];
}

//======= JOURNAL DES RECHERCHES (best-effort) =======

export async function logSearch(rawSample: string, term: string, found: boolean, resultCount: number): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO elena_searches (term, raw_sample, found, result_count)
      VALUES (${term}, ${rawSample}, ${found}, ${resultCount})
      ON CONFLICT (term)
      DO UPDATE SET hits = elena_searches.hits + 1, raw_sample = ${rawSample},
                    found = ${found}, result_count = ${resultCount}, last_seen = now()
    `;
  } catch (error) {
    console.error('[elena] log recherche échoué:', (error as Error).message);
  }
}
