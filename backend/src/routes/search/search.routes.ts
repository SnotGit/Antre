import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

//======= SEARCH ALL =======

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    const section = req.query.section as string | undefined;

    if (!query || query.length < 2) {
      res.json({ results: [] });
      return;
    }

    const searchTerm = query.toLowerCase();

    // Recherche selon la section
    const shouldSearchChroniques = !section || section === 'chroniques';
    const shouldSearchMarsball = !section || section === 'marsball';
    const shouldSearchRover = !section || section === 'rover';
    const shouldSearchBestiaire = !section || section === 'bestiaire';

    const [chroniques, marsball, rover, bestiaire] = await Promise.all([
      shouldSearchChroniques ? prisma.story.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          content: true,
          user: {
            select: {
              username: true
            }
          }
        },
        take: 5
      }) : Promise.resolve([]),

      shouldSearchMarsball ? prisma.marsballItem.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          categoryId: true,
          category: {
            select: {
              title: true
            }
          }
        },
        take: 5
      }) : Promise.resolve([]),

      shouldSearchRover ? prisma.roverItem.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          categoryId: true,
          category: {
            select: {
              title: true
            }
          }
        },
        take: 5
      }) : Promise.resolve([]),

      shouldSearchBestiaire ? prisma.creature.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          categoryId: true,
          category: {
            select: {
              title: true
            }
          }
        },
        take: 5
      }) : Promise.resolve([])
    ]);

    const results = [
      ...chroniques.map(item => ({
        id: item.id,
        title: item.title,
        description: item.content.substring(0, 100) + '...',
        category: `Par ${item.user.username}`,
        type: 'chronique',
        route: `/chroniques/${item.user.username}/${item.title.replace(/ /g, '-')}`
      })),
      ...marsball.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        category: item.category.title,
        type: 'marsball',
        route: `/marsball/${item.categoryId}`
      })),
      ...rover.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        category: item.category.title,
        type: 'rover',
        route: `/marsball/rover/${item.categoryId}`
      })),
      ...bestiaire.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        category: item.category.title,
        type: 'bestiaire',
        route: `/marsball/bestiaire/${item.categoryId}`
      }))
    ];

    res.json({ results });
  } catch (error) {
    console.error('Erreur recherche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
