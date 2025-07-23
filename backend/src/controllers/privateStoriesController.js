const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//============ VALIDATION ============

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

//============ BROUILLONS ============

const getDrafts = async (req, res) => {
  try {
    const drafts = await prisma.story.findMany({
      where: { userId: req.user.userId, status: 'DRAFT' },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      message: 'Brouillons récupérés',
      drafts: drafts.map(draft => ({
        id: draft.id,
        title: draft.title,
        lastModified: draft.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ HISTOIRES PUBLIÉES ============

const getPublishedStories = async (req, res) => {
  try {
    const stories = await prisma.story.findMany({
      where: { userId: req.user.userId, status: 'PUBLISHED' },
      select: { 
        id: true, 
        title: true, 
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
        lastModified: story.updatedAt.toISOString(),
        likes: story._count.likes
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ ÉDITION HISTOIRE ============

const getStoryForEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID histoire invalide' });
    }

    const story = await prisma.story.findFirst({
      where: { id: storyId, userId }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    const isEditingPublished = story.status === 'PUBLISHED';
    
    if (isEditingPublished) {
      const draft = await prisma.story.create({
        data: {
          title: story.title,
          content: story.content,
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

//============ SAUVEGARDE ============

const saveDraft = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.userId;

    const error = validateStoryData(title, content);
    if (error) return res.status(400).json({ error });
    
    const story = await prisma.story.create({
      data: { title, content, status: 'DRAFT', userId }
    });

    res.json({
      message: 'Nouveau draft créé',
      story
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.userId;

    const error = validateStoryData(title, content);
    if (error) return res.status(400).json({ error });

    const story = await prisma.story.findFirst({
      where: { id: parseInt(id), userId, status: 'DRAFT' }
    });

    if (!story) {
      return res.status(404).json({ error: 'Draft non trouvé' });
    }

    const updated = await prisma.story.update({
      where: { id: story.id },
      data: { title, content, updatedAt: new Date() }
    });

    res.json({
      message: 'Draft sauvegardé',
      story: updated
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ PUBLICATION ============

const publishStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const story = await prisma.story.findFirst({
      where: { id: parseInt(id), userId, status: 'DRAFT' }
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
    const { id } = req.params;
    const { originalId } = req.body;
    const userId = req.user.userId;

    if (!originalId) {
      return res.status(400).json({ error: 'ID original requis' });
    }

    const [draft, original] = await Promise.all([
      prisma.story.findFirst({ where: { id: parseInt(id), userId, status: 'DRAFT' } }),
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

//============ SUPPRESSION ============

const cancelNewStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const story = await prisma.story.findFirst({
      where: { id: parseInt(id), userId }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    await prisma.story.delete({ where: { id: story.id } });

    res.json({ message: 'Nouvelle histoire annulée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const story = await prisma.story.findFirst({
      where: { id: parseInt(id), userId }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    await prisma.story.delete({ where: { id: story.id } });

    res.json({ message: 'Brouillon supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deletePublished = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const story = await prisma.story.findFirst({
      where: { id: parseInt(id), userId }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    await prisma.story.delete({ where: { id: story.id } });

    res.json({ message: 'Histoire publiée supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ LIKES ============

const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID histoire invalide' });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { userId: true, status: true }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    if (story.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'Histoire non publiée' });
    }

    if (story.userId === userId) {
      return res.status(403).json({ 
        error: 'Vous ne pouvez pas liker votre propre histoire' 
      });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_storyId: {
          userId: userId,
          storyId: storyId
        }
      }
    });

    let isLiked;
    
    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      isLiked = false;
    } else {
      await prisma.like.create({
        data: {
          userId: userId,
          storyId: storyId
        }
      });
      isLiked = true;
    }

    const totalLikes = await prisma.like.count({
      where: { storyId: storyId }
    });

    res.json({
      success: true,
      liked: isLiked,
      totalLikes: totalLikes
    });

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
  updateDraft,
  publishStory,
  republishStory,
  cancelNewStory,
  deleteDraft,
  deletePublished,
  toggleLike
};