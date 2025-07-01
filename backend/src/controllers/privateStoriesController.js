const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
};

const getStatusLabel = (createdAt, updatedAt) => {
  const isModified = new Date(updatedAt) > new Date(createdAt);
  return isModified ? 'Modifié' : 'Nouveau';
};

const getDrafts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const drafts = await prisma.story.findMany({
      where: {
        userId: userId,
        status: 'DRAFT'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const formattedDrafts = drafts.map(draft => ({
      id: draft.id,
      title: draft.title || 'Histoire sans titre',
      lastModified: formatTimeAgo(draft.updatedAt),
      status: getStatusLabel(draft.createdAt, draft.updatedAt)
    }));

    res.json({
      message: 'Brouillons récupérés avec succès',
      drafts: formattedDrafts,
      count: formattedDrafts.length
    });

  } catch (error) {
    console.error('Erreur getDrafts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getPublishedStories = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stories = await prisma.story.findMany({
      where: {
        userId: userId,
        status: 'PUBLISHED'
      },
      include: {
        _count: {
          select: { likes: true }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const formattedStories = stories.map(story => ({
      id: story.id,
      title: story.title,
      lastModified: formatTimeAgo(story.updatedAt),
      likes: story._count.likes
    }));

    res.json({
      message: 'Histoires publiées récupérées avec succès',
      published: formattedStories,
      count: formattedStories.length
    });

  } catch (error) {
    console.error('Erreur getPublishedStories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const draftsCount = await prisma.story.count({
      where: {
        userId: userId,
        status: 'DRAFT'
      }
    });

    const publishedCount = await prisma.story.count({
      where: {
        userId: userId,
        status: 'PUBLISHED'
      }
    });

    const totalLikes = await prisma.like.count({
      where: {
        story: {
          userId: userId,
          status: 'PUBLISHED'
        }
      }
    });

    res.json({
      message: 'Statistiques récupérées avec succès',
      stats: {
        drafts: draftsCount,
        published: publishedCount,
        totalLikes: totalLikes
      }
    });

  } catch (error) {
    console.error('Erreur getStats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const saveDraft = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.userId;
    const { id } = req.params;

    if (id) {
      // Mise à jour brouillon existant
      const storyId = parseInt(id);
      
      const updatedStory = await prisma.story.update({
        where: {
          id: storyId,
          userId: userId,
          status: 'DRAFT'
        },
        data: {
          title: title || 'Histoire sans titre',
          content: content || '',
          updatedAt: new Date()
        }
      });

      res.json({
        message: 'Brouillon mis à jour avec succès',
        story: updatedStory
      });

    } else {
      // Création nouveau brouillon
      const newStory = await prisma.story.create({
        data: {
          title: title || 'Histoire sans titre',
          content: content || '',
          status: 'DRAFT',
          userId: userId
        }
      });

      res.json({
        message: 'Brouillon créé avec succès',
        story: newStory
      });
    }

  } catch (error) {
    console.error('Erreur saveDraft:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const publishStory = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID histoire invalide' });
    }

    const updatedStory = await prisma.story.update({
      where: {
        id: storyId,
        userId: userId
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Histoire publiée avec succès',
      story: updatedStory
    });

  } catch (error) {
    console.error('Erreur publishStory:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID histoire invalide' });
    }

    await prisma.story.delete({
      where: {
        id: storyId,
        userId: userId
      }
    });

    res.json({
      message: 'Histoire supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur deleteStory:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getDraftById = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID histoire invalide' });
    }

    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
        status: 'DRAFT'
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Brouillon non trouvé' });
    }

    res.json({
      message: 'Brouillon récupéré avec succès',
      story: story
    });

  } catch (error) {
    console.error('Erreur getDraftById:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getDrafts,
  getPublishedStories,
  getStats,
  saveDraft,
  publishStory,
  deleteStory,
  getDraftById
};