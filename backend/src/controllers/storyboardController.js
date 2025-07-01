const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//============ GET STATS ============
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
      stats: { draftsCount, publishedCount, totalLikes }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ GET DRAFTS ============
const getDrafts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const drafts = await prisma.story.findMany({
      where: { userId, status: 'DRAFT' },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' }
    });

    const formattedDrafts = drafts.map(draft => ({
      id: draft.id,
      title: draft.title || `Brouillon ${draft.id}`,
      lastModified: getTimeAgo(draft.updatedAt)
    }));

    res.json({
      message: 'Brouillons récupérés',
      drafts: formattedDrafts,
      count: formattedDrafts.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ GET PUBLISHED ============
const getPublished = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stories = await prisma.story.findMany({
      where: { userId, status: 'PUBLISHED' },
      include: { _count: { select: { likes: true } } },
      orderBy: { publishedAt: 'desc' }
    });

    const formattedStories = stories.map(story => ({
      id: story.id,
      title: story.title,
      publishDate: formatPublishDate(story.publishedAt),
      likes: story._count.likes
    }));

    res.json({
      message: 'Histoires publiées récupérées',
      stories: formattedStories,
      count: formattedStories.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ CREATE DRAFT ============
const createDraft = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Compter drafts existants pour titre auto
    const draftCount = await prisma.story.count({
      where: { userId, status: 'DRAFT' }
    });

    const newDraft = await prisma.story.create({
      data: {
        title: `Brouillon ${draftCount + 1}`,
        content: '',
        status: 'DRAFT',
        userId: userId,
        slug: `draft-${userId}-${Date.now()}`
      },
      select: { id: true, title: true, content: true }
    });

    res.status(201).json({
      message: 'Nouveau brouillon créé',
      draft: newDraft
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ UPDATE STORY ============
const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.userId;

    const story = await prisma.story.findFirst({
      where: { id: parseInt(id), userId }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    const updatedStory = await prisma.story.update({
      where: { id: parseInt(id) },
      data: {
        title: title?.trim() || story.title,
        content: content || story.content
      },
      select: { id: true, title: true, content: true, status: true }
    });

    res.json({
      message: 'Histoire mise à jour',
      story: updatedStory
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ PUBLISH STORY ============
const publishStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const story = await prisma.story.findFirst({
      where: { id: parseInt(id), userId, status: 'DRAFT' }
    });

    if (!story) {
      return res.status(404).json({ error: 'Brouillon non trouvé' });
    }

    const publishedStory = await prisma.story.update({
      where: { id: parseInt(id) },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        slug: createSlug(story.title, story.id)
      },
      select: { id: true, title: true, slug: true }
    });

    res.json({
      message: 'Histoire publiée',
      story: publishedStory
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ DELETE STORY ============
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const story = await prisma.story.findFirst({
      where: { id: parseInt(id), userId }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    await prisma.story.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Histoire supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ UTILITY FUNCTIONS ============
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Il y a moins d\'1 heure';
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

  return new Date(date).toLocaleDateString('fr-FR');
}

function formatPublishDate(date) {
  if (!date) return 'Date inconnue';
  
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function createSlug(title, id) {
  const baseSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  
  return `${baseSlug}-${id}`;
}

module.exports = {
  getStats,
  getDrafts,
  getPublished,
  createDraft,
  updateStory,
  publishStory,
  deleteStory
};