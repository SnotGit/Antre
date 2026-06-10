const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const drafts = await prisma.story.count({ where: { status: 'DRAFT' } });
  const published = await prisma.story.count({ where: { status: 'PUBLISHED' } });
  const likes = await prisma.like.count();

  console.log('=== VOLUMES ===');
  console.log(`users: ${users} | brouillons: ${drafts} | publiées: ${published} | likes: ${likes}`);

  console.log('=== INTEGRITE ===');

  const revisions = await prisma.story.findMany({
    where: { originalStoryId: { not: null } },
    select: { id: true, title: true, originalStoryId: true, status: true, userId: true }
  });

  const orphanRevisions = [];
  const seenOriginals = new Map();
  const duplicateRevisions = [];

  for (const rev of revisions) {
    const original = await prisma.story.findUnique({ where: { id: rev.originalStoryId } });
    if (!original) orphanRevisions.push(rev);

    const key = `${rev.userId}-${rev.originalStoryId}`;
    if (seenOriginals.has(key)) duplicateRevisions.push(rev);
    seenOriginals.set(key, rev.id);
  }

  console.log(`révisions orphelines (originale supprimée): ${orphanRevisions.length}`);
  orphanRevisions.forEach(r => console.log(`  - #${r.id} "${r.title}" -> originale #${r.originalStoryId} absente`));

  console.log(`révisions en double pour une même originale: ${duplicateRevisions.length}`);
  duplicateRevisions.forEach(r => console.log(`  - #${r.id} "${r.title}" -> originale #${r.originalStoryId}`));

  const publishedNoSlug = await prisma.story.findMany({
    where: { status: 'PUBLISHED', OR: [{ slug: null }, { slug: '' }] },
    select: { id: true, title: true }
  });
  console.log(`publiées sans slug (URL cassée): ${publishedNoSlug.length}`);
  publishedNoSlug.forEach(s => console.log(`  - #${s.id} "${s.title}"`));

  const publishedNoDate = await prisma.story.count({ where: { status: 'PUBLISHED', publishedAt: null } });
  console.log(`publiées sans date de publication: ${publishedNoDate}`);

  const publishedEmptyTitle = await prisma.story.count({ where: { status: 'PUBLISHED', title: '' } });
  console.log(`publiées au titre vide: ${publishedEmptyTitle}`);

  const likesOnDrafts = await prisma.like.count({ where: { story: { status: 'DRAFT' } } });
  console.log(`likes sur des brouillons (anormal): ${likesOnDrafts}`);

  const selfLikes = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count FROM likes l JOIN stories s ON s.id = l.story_id WHERE s.user_id = l.user_id
  `;
  console.log(`auto-likes (anormal): ${selfLikes[0].count}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
