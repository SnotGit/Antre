const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//============ HELPERS ============

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[àáâäãåā]/g, 'a')
    .replace(/[èéêëēė]/g, 'e')
    .replace(/[ìíîïīį]/g, 'i')
    .replace(/[òóôöõøō]/g, 'o')
    .replace(/[ùúûüūų]/g, 'u')
    .replace(/[ÿý]/g, 'y')
    .replace(/[ñń]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const ensureUniqueSlug = async (baseSlug, userId) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (await prisma.story.findFirst({ where: { slug, userId } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

const validateStoryData = (title, content) => {
  if (!title?.trim()) return 'Titre requis';
  if (!content?.trim()) return 'Contenu requis';
  return null;
};

//============ STATISTIQUES ============

const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [draftsCount, publishedCount, totalLikes] = await Promise.all([
      prisma.story.count({ where: { userId, status: 'DRAFT' } }),
      prisma.story.count({ where: { userId, status: 'PUBLISHED' } }),
      prisma.like.count({ where: { story: { userId, status: 'PUBLISHED' } } })
    ]);

    res.json({
      message: 'Statistiques récupérées',
      stats: { drafts: draftsCount, published: publishedCount, totalLikes }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ LECTURE ============

const getDrafts = async (req, res) => {
  try {
    const drafts = await prisma.story.findMany({
      where: { userId: req.user.userId, status: 'DRAFT' },
      select: { id: true, title: true, slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      message: 'Brouillons récupérés',
      drafts: drafts.map(draft => ({
        id: draft.id,
        title: draft.title,
        slug: draft.slug,
        lastModified: draft.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getPublishedStories = async (req, res) => {
  try {
    const stories = await prisma.story.findMany({
      where: { userId: req.user.userId, status: 'PUBLISHED' },
      select: { 
        id: true, 
        title: true, 
        slug: true, 
        updatedAt: true,
        _count: { select: { likes: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      message: 'Histoires publiées récupérées',
      published: stories.map(story => ({
        id: story.id,
        title: story.title,
        slug: story.slug,
        lastModified: story.updatedAt.toISOString(),
        likes: story._count.likes
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getStoryForEdit = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;

    const story = await prisma.story.findFirst({
      where: { slug, userId }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    const isEditingPublished = story.status === 'PUBLISHED';
    
    if (isEditingPublished) {
      const newSlug = await ensureUniqueSlug(generateSlug(story.title), userId);
      
      const draft = await prisma.story.create({
        data: {
          title: story.title,
          content: story.content,
          slug: newSlug,
          status: 'DRAFT',
          userId
        }
      });

      return res.json({
        message: 'Draft créé pour édition',
        story: draft,
        originalStoryId: story.id
      });
    }

    res.json({
      message: 'Draft récupéré',
      story,
      originalStoryId: null
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ ÉCRITURE ============

const saveDraft = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content } = req.body;
    const userId = req.user.userId;

    const error = validateStoryData(title, content);
    if (error) return res.status(400).json({ error });

    if (slug) {
      const story = await prisma.story.findFirst({
        where: { slug, userId, status: 'DRAFT' }
      });

      if (!story) {
        return res.status(404).json({ error: 'Draft non trouvé' });
      }

      const updated = await prisma.story.update({
        where: { id: story.id },
        data: { title, content, updatedAt: new Date() }
      });

      return res.json({
        message: 'Draft sauvegardé',
        story: updated
      });
    }

    const newSlug = await ensureUniqueSlug(generateSlug(title), userId);
    
    const story = await prisma.story.create({
      data: { title, content, slug: newSlug, status: 'DRAFT', userId }
    });

    res.json({
      message: 'Nouveau draft créé',
      story
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const publishStory = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;

    const story = await prisma.story.findFirst({
      where: { slug, userId, status: 'DRAFT' }
    });

    if (!story) {
      return res.status(404).json({ error: 'Draft non trouvé' });
    }

    const error = validateStoryData(story.title, story.content);
    if (error) return res.status(400).json({ error });

    await prisma.story.update({
      where: { id: story.id },
      data: { 
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Histoire publiée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const republishStory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { originalId } = req.body;
    const userId = req.user.userId;

    const [draft, original] = await Promise.all([
      prisma.story.findFirst({ where: { slug, userId, status: 'DRAFT' } }),
      prisma.story.findFirst({ where: { id: parseInt(originalId), userId, status: 'PUBLISHED' } })
    ]);

    if (!draft || !original) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    const error = validateStoryData(draft.title, draft.content);
    if (error) return res.status(400).json({ error });

    await Promise.all([
      prisma.story.update({
        where: { id: original.id },
        data: { 
          title: draft.title, 
          content: draft.content, 
          updatedAt: new Date() 
        }
      }),
      prisma.story.delete({ where: { id: draft.id } })
    ]);

    res.json({ message: 'Histoire mise à jour avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteStory = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;

    const story = await prisma.story.findFirst({
      where: { slug, userId }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    await prisma.story.delete({ where: { id: story.id } });

    res.json({ message: 'Histoire supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ EXPORTS ============

module.exports = {
  getStats,
  getDrafts,
  getPublishedStories,
  getStoryForEdit,
  saveDraft,
  publishStory,
  republishStory,
  deleteStory
};