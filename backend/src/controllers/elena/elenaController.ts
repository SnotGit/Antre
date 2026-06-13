import { Response } from 'express';
import path from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { prisma } from '@db';
import { AuthenticatedRequest } from '@models/shared';
import { handleError, sendNotFound, sendBadRequest } from '@utils/global/helpers';
import { ELENA_SECTIONS, ElenaSection, ElenaLotReport, ElenaReviewEntry } from '@models/elena';
import { processLotImage, CardType } from '@utils/elena/image';
import { formatTitle } from '@utils/elena/title';
import { fileHash, loadHashRegistry, saveHashRegistry } from '@utils/elena/hashes';
import { indexItem, searchEmbeddings } from '@utils/elena/embeddings';
import { normalizeLexical, findCategoryMatches, findItemMatches, logSearch, CategoryMatch, ItemMatch } from '@utils/elena/search';

const REVIEW_DIR = path.join('staging', 'review');

//======= HELPERS =======

function isSection(value: string): value is ElenaSection {
  return (ELENA_SECTIONS as readonly string[]).includes(value);
}

function cardTypeFor(section: ElenaSection): CardType {
  return section === 'bestiaire' ? 'bestiaireCard' : 'itemCard';
}

// multer livre originalname en latin1, les accents arrivent cassés sans ce décodage
function decodeName(name: string): string {
  return Buffer.from(name, 'latin1').toString('utf-8');
}

function normalizeBase(name: string): string {
  const lastDot = name.lastIndexOf('.');
  const withoutExt = lastDot !== -1 ? name.substring(0, lastDot) : name;
  return withoutExt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function isTxt(name: string): boolean {
  return name.toLowerCase().endsWith('.txt');
}

async function findLeafCategory(section: ElenaSection, categoryId: number): Promise<'not-found' | 'branch' | 'ok'> {
  const args = {
    where: { id: categoryId },
    include: { _count: { select: { children: true } } }
  };

  let category: { _count: { children: number } } | null = null;

  if (section === 'marsball') {
    category = await prisma.marsballCategory.findUnique(args);
  } else if (section === 'bestiaire') {
    category = await prisma.bestiaireCategory.findUnique(args);
  } else if (section === 'terraformars') {
    category = await prisma.terraformarsCategory.findUnique(args);
  } else {
    category = await prisma.roverCategory.findUnique(args);
  }

  if (!category) return 'not-found';
  if (category._count.children > 0) return 'branch';
  return 'ok';
}

async function createItem(
  section: ElenaSection,
  data: { title: string; imageUrl: string; thumbnailUrl: string; description: string | null; categoryId: number }
): Promise<void> {
  let created: { id: number };
  if (section === 'marsball') {
    created = await prisma.marsballItem.create({ data });
  } else if (section === 'bestiaire') {
    created = await prisma.bestiaireItem.create({ data });
  } else if (section === 'terraformars') {
    created = await prisma.terraformarsItem.create({ data });
  } else {
    created = await prisma.roverItem.create({ data });
  }
  await indexItem(section, created.id);
}

function writeReview(fileName: string, buffer: Buffer): void {
  mkdirSync(REVIEW_DIR, { recursive: true });
  const safeName = fileName.replace(/[/\\:*?"<>|]/g, '_');
  writeFileSync(path.join(REVIEW_DIR, `${Date.now()}-${safeName}`), buffer);
}

//======= DEPOSIT LOT =======

export const depositLot = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { section, categoryId } = req.body;

    if (typeof section !== 'string' || !isSection(section)) {
      sendBadRequest(res, 'Section invalide');
      return;
    }

    const catId = parseInt(categoryId, 10);
    if (isNaN(catId)) {
      sendBadRequest(res, 'Catégorie invalide');
      return;
    }

    const categoryState = await findLeafCategory(section, catId);
    if (categoryState === 'not-found') {
      sendNotFound(res, 'Catégorie non trouvée');
      return;
    }
    if (categoryState === 'branch') {
      sendBadRequest(res, 'Les items se rangent au bout des branches');
      return;
    }

    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) {
      sendBadRequest(res, 'Aucun fichier');
      return;
    }

    const images = new Map<string, { name: string; buffer: Buffer }>();
    const descriptions = new Map<string, string>();

    for (const file of files) {
      const name = decodeName(file.originalname);
      const base = normalizeBase(name);
      if (isTxt(name)) {
        descriptions.set(base, file.buffer.toString('utf-8').trim());
      } else {
        images.set(base, { name, buffer: file.buffer });
      }
    }

    let ignored = 0;
    for (const base of descriptions.keys()) {
      if (!images.has(base)) ignored++;
    }

    const fullDir = path.join('uploads', section, 'full');
    const thumbDir = path.join('uploads', section, 'thumbnails');
    mkdirSync(fullDir, { recursive: true });
    mkdirSync(thumbDir, { recursive: true });

    const registry = loadHashRegistry();
    const card = cardTypeFor(section);
    const review: ElenaReviewEntry[] = [];
    let created = 0;
    let duplicates = 0;

    for (const [base, image] of images) {
      const hash = fileHash(image.buffer);
      if (registry[hash]) {
        duplicates++;
        continue;
      }

      const result = await processLotImage(image.buffer, card);
      if (!result.ok) {
        writeReview(image.name, image.buffer);
        review.push({ file: image.name, reason: result.reason });
        continue;
      }

      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
      writeFileSync(path.join(fullDir, filename), result.main);
      writeFileSync(path.join(thumbDir, filename), result.thumb);

      const imageUrl = `/uploads/${section}/full/${filename}`;
      await createItem(section, {
        title: formatTitle(image.name),
        imageUrl,
        thumbnailUrl: `/uploads/${section}/thumbnails/${filename}`,
        description: descriptions.get(base) ?? null,
        categoryId: catId
      });

      registry[hash] = imageUrl;
      created++;
    }

    saveHashRegistry(registry);

    const report: ElenaLotReport = { created, duplicates, review, ignored };
    res.status(201).json({ report });
  } catch (error) {
    handleError(res, 'Erreur lors du traitement du lot');
  }
};

//======= SEARCH =======

const SEMANTIC_THRESHOLD = 0.55; // score = 1 - distance cosinus ; défaut prudent, à calibrer sur le vrai corpus

interface SearchRow {
  id: number;
  title: string;
  description: string | null;
  categoryId: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  category: { title: string };
}

const ITEM_SELECT = {
  id: true, title: true, description: true, categoryId: true,
  imageUrl: true, thumbnailUrl: true, category: { select: { title: true } }
};

// miroir de MarsballTreeService.slugify : minuscule + espaces -> tirets (accents conservés)
function slugify(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-');
}

function routeFor(section: ElenaSection, categoryTitle: string): string {
  const slug = slugify(categoryTitle);
  if (section === 'marsball') return `/marsball/${slug}`;
  if (section === 'bestiaire') return `/marsball/bestiaire/${slug}`;
  if (section === 'rover') return `/marsball/rover/${slug}`;
  return `/terraformars/${slug}`;
}

function itemCard(section: ElenaSection, row: SearchRow, score: number | null) {
  return {
    kind: 'item' as const,
    section,
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category.title,
    categoryId: row.categoryId,
    imageUrl: row.thumbnailUrl ?? row.imageUrl,
    route: routeFor(section, row.category.title),
    score
  };
}

function categoryCard(match: CategoryMatch) {
  return {
    kind: 'category' as const,
    section: match.section,
    id: match.id,
    title: match.title,
    itemCount: match.itemCount,
    route: routeFor(match.section, match.title)
  };
}

function itemMatchCard(match: ItemMatch) {
  return {
    kind: 'item' as const,
    section: match.section,
    id: match.id,
    title: match.title,
    description: match.description ?? '',
    category: match.categoryTitle,
    categoryId: match.categoryId,
    imageUrl: match.thumbnailUrl ?? match.imageUrl,
    route: routeFor(match.section, match.categoryTitle),
    score: null
  };
}

async function itemsByIds(section: ElenaSection, ids: number[]): Promise<SearchRow[]> {
  if (ids.length === 0) return [];
  const args = { where: { id: { in: ids } }, select: ITEM_SELECT };
  if (section === 'marsball') return prisma.marsballItem.findMany(args);
  if (section === 'bestiaire') return prisma.bestiaireItem.findMany(args);
  if (section === 'rover') return prisma.roverItem.findMany(args);
  return prisma.terraformarsItem.findMany(args);
}

export const searchArchives = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const raw = typeof req.body.query === 'string' ? req.body.query.trim() : '';
  try {
    const termNorm = normalizeLexical(raw);
    if (termNorm.length < 2) {
      res.json({ results: [] });
      return;
    }

    // 1) lexical : le terme apparaît dans un nom de catégorie, un titre ou une description ?
    const [categories, items] = await Promise.all([
      findCategoryMatches(termNorm),
      findItemMatches(termNorm)
    ]);

    if (categories.length > 0 || items.length > 0) {
      const results = [...categories.map(categoryCard), ...items.map(itemMatchCard)];
      await logSearch(raw, termNorm, true, results.length);
      res.json({ results });
      return;
    }

    // 2) sémantique : aucun match lexical → vrai flou, filtré par le seuil
    const hits = await searchEmbeddings(raw, 10);
    const kept = hits.filter(hit => 1 - hit.distance >= SEMANTIC_THRESHOLD);
    if (kept.length === 0) {
      await logSearch(raw, termNorm, false, 0);
      res.json({ results: [] });
      return;
    }

    const bySection: Record<ElenaSection, number[]> = { marsball: [], bestiaire: [], rover: [], terraformars: [] };
    for (const hit of kept) bySection[hit.section].push(hit.itemId);

    const fetched = await Promise.all(
      (Object.keys(bySection) as ElenaSection[]).map(s => itemsByIds(s, bySection[s]).then(rows => ({ section: s, rows })))
    );
    const lookup = new Map<string, SearchRow>();
    for (const group of fetched) for (const row of group.rows) lookup.set(`${group.section}:${row.id}`, row);

    const results = kept
      .map(hit => {
        const row = lookup.get(`${hit.section}:${hit.itemId}`);
        return row ? itemCard(hit.section, row, Number((1 - hit.distance).toFixed(4))) : null;
      })
      .filter(r => r !== null);

    await logSearch(raw, termNorm, results.length > 0, results.length);
    res.json({ results });
  } catch (error) {
    handleError(res, 'Erreur lors de la recherche');
  }
};
