import { PrismaClient } from '@prisma/client';

export function generateSlug(title: string): string {
  return title
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function generateUniqueSlug(
  prisma: PrismaClient,
  title: string,
  userId: number,
  excludeStoryId?: number
): Promise<string> {
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.story.findFirst({
      where: {
        userId,
        slug,
        id: excludeStoryId ? { not: excludeStoryId } : undefined
      }
    });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
