import { createHash } from 'crypto';
import { prisma } from '@db';
import { ElenaSection } from '@models/elena';

//======= CONFIG =======

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const EMBED_MODEL = 'nomic-embed-text';

//======= TYPES =======

export interface EmbeddingHit {
  section: ElenaSection;
  itemId: number;
  distance: number;
}

interface ItemContext {
  title: string;
  description: string | null;
  categoryTitle: string;
}

//======= HELPERS =======

function toVectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`;
}

async function embed(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text })
  });
  if (!response.ok) {
    throw new Error(`Ollama ${response.status}`);
  }
  const data = (await response.json()) as { embedding?: number[] };
  if (!data.embedding || data.embedding.length === 0) {
    throw new Error('Embedding vide');
  }
  return data.embedding;
}

// le nom de la catégorie est embeddé en tête : l'item « sait » à quelle catégorie il appartient
async function loadItemContext(section: ElenaSection, itemId: number): Promise<ItemContext | null> {
  const select = { title: true, description: true, category: { select: { title: true } } };
  let row: { title: string; description: string | null; category: { title: string } } | null;

  if (section === 'marsball') {
    row = await prisma.marsballItem.findUnique({ where: { id: itemId }, select });
  } else if (section === 'bestiaire') {
    row = await prisma.bestiaireItem.findUnique({ where: { id: itemId }, select });
  } else if (section === 'terraformars') {
    row = await prisma.terraformarsItem.findUnique({ where: { id: itemId }, select });
  } else {
    row = await prisma.roverItem.findUnique({ where: { id: itemId }, select });
  }

  if (!row) return null;
  return { title: row.title, description: row.description, categoryTitle: row.category.title };
}

//======= INDEXATION (best-effort) =======
// Ne jamais faire échouer la création/édition d'un item : si Ollama est éteint,
// l'item reste créé, juste pas encore indexé (une réindexation le rattrapera).

export async function indexItem(section: ElenaSection, itemId: number): Promise<void> {
  try {
    const ctx = await loadItemContext(section, itemId);
    if (!ctx) return;

    const text = `${ctx.categoryTitle}\n${ctx.title}\n${ctx.description ?? ''}`;
    const hash = createHash('sha256').update(text).digest('hex');

    const existing = await prisma.$queryRaw<{ content_hash: string }[]>`
      SELECT content_hash FROM elena_embeddings WHERE section = ${section} AND item_id = ${itemId}
    `;
    if (existing[0]?.content_hash === hash) return;

    const literal = toVectorLiteral(await embed(`search_document: ${text}`));

    await prisma.$executeRaw`
      INSERT INTO elena_embeddings (section, item_id, content_hash, embedding, updated_at)
      VALUES (${section}, ${itemId}, ${hash}, ${literal}::vector, now())
      ON CONFLICT (section, item_id)
      DO UPDATE SET content_hash = ${hash}, embedding = ${literal}::vector, updated_at = now()
    `;
  } catch (error) {
    console.error(`[elena] indexation échouée (${section}#${itemId}):`, (error as Error).message);
  }
}

//======= RECHERCHE SÉMANTIQUE =======
// Texte naturel (accents/casse gardés : le modèle les comprend).

export async function searchEmbeddings(query: string, k: number): Promise<EmbeddingHit[]> {
  const literal = toVectorLiteral(await embed(`search_query: ${query}`));

  const rows = await prisma.$queryRaw<{ section: ElenaSection; item_id: number; distance: number }[]>`
    SELECT section, item_id, embedding <=> ${literal}::vector AS distance
    FROM elena_embeddings
    ORDER BY embedding <=> ${literal}::vector
    LIMIT ${k}
  `;

  return rows.map(r => ({ section: r.section, itemId: r.item_id, distance: Number(r.distance) }));
}
