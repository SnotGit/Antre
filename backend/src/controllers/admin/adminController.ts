import { Response } from 'express';
import { readdirSync, statSync, existsSync } from 'fs';
import path from 'path';
import { prisma } from '@db';
import { AuthenticatedRequest } from '@models/shared';
import { handleError } from '@utils/global/helpers';
import { onlineCount } from '@utils/global/presence';

//======= HELPERS =======

function dirSize(dir: string): number {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(full);
    } else {
      total += statSync(full).size;
    }
  }
  return total;
}

function lastBackupDate(): string | null {
  const dir = 'backups';
  if (!existsSync(dir)) return null;
  let latest: Date | null = null;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.dump')) continue;
    const mtime = statSync(path.join(dir, file)).mtime;
    if (!latest || mtime > latest) latest = mtime;
  }
  return latest ? latest.toISOString() : null;
}

//======= GET STATS =======

export const getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      users,
      admins,
      stories,
      marsballCategories, marsballItems,
      bestiaireCategories, bestiaireItems,
      roverCategories, roverItems,
      terraformarsCategories, terraformarsItems
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.story.count({ where: { status: 'PUBLISHED' } }),
      prisma.marsballCategory.count(), prisma.marsballItem.count(),
      prisma.bestiaireCategory.count(), prisma.bestiaireItem.count(),
      prisma.roverCategory.count(), prisma.roverItem.count(),
      prisma.terraformarsCategory.count(), prisma.terraformarsItem.count()
    ]);

    res.json({
      stats: {
        users,
        admins,
        online: onlineCount(),
        stories,
        categories: marsballCategories + bestiaireCategories + roverCategories + terraformarsCategories,
        items: marsballItems + bestiaireItems + roverItems + terraformarsItems,
        sections: {
          marsball: { categories: marsballCategories, items: marsballItems },
          bestiaire: { categories: bestiaireCategories, items: bestiaireItems },
          rover: { categories: roverCategories, items: roverItems },
          terraformars: { categories: terraformarsCategories, items: terraformarsItems }
        },
        uploadsBytes: dirSize('uploads'),
        lastBackup: lastBackupDate()
      }
    });
  } catch (error) {
    handleError(res, 'Erreur lors de la récupération des statistiques');
  }
};
