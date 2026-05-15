import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateSlug(title: string): string {
  return title
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const publishedStories = await prisma.story.findMany({
    where: { status: 'PUBLISHED', slug: null },
    select: { id: true, title: true, userId: true }
  });

  console.log(`${publishedStories.length} stories publiees sans slug`);

  for (const story of publishedStories) {
    const baseSlug = generateSlug(story.title);
    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await prisma.story.findFirst({
        where: { userId: story.userId, slug, id: { not: story.id } }
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    await prisma.story.update({
      where: { id: story.id },
      data: { slug }
    });

    console.log(`  [${story.id}] "${story.title}" -> ${slug}`);
  }

  console.log('Termine.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
