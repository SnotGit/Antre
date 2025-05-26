// src/controllers/chroniquesController.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Récupérer les brouillons de l'utilisateur connecté
const getUserDrafts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const drafts = await prisma.story.findMany({
      where: {
        userId: userId,
        status: 'DRAFT'
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Formater les données pour le frontend
    const formattedDrafts = drafts.map(draft => ({
      id: draft.id,
      title: draft.title || 'Histoire sans titre',
      lastModified: getTimeAgo(draft.updatedAt),
      status: getStatusLabel(draft.createdAt, draft.updatedAt)
    }));

    res.json({
      message: 'Brouillons récupérés avec succès',
      drafts: formattedDrafts,
      count: formattedDrafts.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des brouillons:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les histoires publiées de l'utilisateur connecté
const getUserPublishedStories = async (req, res) => {
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
        publishedAt: 'desc'
      }
    });

    // Formater les données pour le frontend
    const formattedStories = stories.map(story => ({
      id: story.id,
      title: story.title,
      publishDate: formatPublishDate(story.publishedAt),
      likes: story._count.likes,
    }));

    res.json({
      message: 'Histoires publiées récupérées avec succès',
      stories: formattedStories,
      count: formattedStories.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des histoires publiées:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer le nombre total de likes reçus par l'utilisateur
const getUserTotalLikes = async (req, res) => {
  try {
    const userId = req.user.userId;

    const totalLikes = await prisma.like.count({
      where: {
        story: {
          userId: userId,
          status: 'PUBLISHED'
        }
      }
    });

    res.json({
      message: 'Total likes récupéré avec succès',
      totalLikes: totalLikes
    });

  } catch (error) {
    console.error('Erreur récupération total likes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Publier un brouillon
const publishStory = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID d\'histoire invalide' });
    }

    // Vérifier que l'histoire existe et appartient à l'utilisateur
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
        status: 'DRAFT'
      }
    });

    if (!story) {
      return res.status(404).json({
        error: 'Brouillon non trouvé ou déjà publié'
      });
    }

    // Publier l'histoire
    const publishedStory = await prisma.story.update({
      where: { id: storyId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            description: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      message: 'Histoire publiée avec succès',
      story: publishedStory
    });

  } catch (error) {
    console.error('Erreur lors de la publication:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la publication' });
  }
};

// Liker une histoire
const likeStory = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID d\'histoire invalide' });
    }

    // Vérifier que l'histoire existe et est publiée
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        status: 'PUBLISHED'
      }
    });

    if (!story) {
      return res.status(404).json({
        error: 'Histoire non trouvée ou non publiée'
      });
    }

    // Vérifier si l'utilisateur a déjà liké cette histoire
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_storyId: {
          userId: userId,
          storyId: storyId
        }
      }
    });

    if (existingLike) {
      return res.status(400).json({
        error: 'Vous avez déjà liké cette histoire'
      });
    }

    // Créer le like
    await prisma.like.create({
      data: {
        userId: userId,
        storyId: storyId
      }
    });

    // Récupérer le nouveau nombre de likes
    const likesCount = await prisma.like.count({
      where: { storyId: storyId }
    });

    res.json({
      message: 'Histoire likée avec succès',
      likesCount: likesCount
    });

  } catch (error) {
    console.error('Erreur lors du like:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Archiver une histoire publiée
const archiveStory = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID d\'histoire invalide' });
    }

    // Vérifier que l'histoire existe et appartient à l'utilisateur
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
        status: 'PUBLISHED'
      }
    });

    if (!story) {
      return res.status(404).json({
        error: 'Histoire non trouvée ou non publiée'
      });
    }

    // Archiver l'histoire
    await prisma.story.update({
      where: { id: storyId },
      data: {
        status: 'ARCHIVED'
      }
    });

    res.json({
      message: 'Histoire archivée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'archivage:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'archivage' });
  }
};

// Créer ou sauvegarder un brouillon
const saveDraft = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.userId;
    const { id } = req.params; // ID optionnel pour mise à jour

    // Si ID fourni, c'est une mise à jour
    if (id) {
      const storyId = parseInt(id);

      if (isNaN(storyId)) {
        return res.status(400).json({ error: 'ID d\'histoire invalide' });
      }

      // Vérifier que le brouillon existe et appartient à l'utilisateur
      const existingDraft = await prisma.story.findFirst({
        where: {
          id: storyId,
          userId: userId,
          status: 'DRAFT'
        }
      });

      if (!existingDraft) {
        return res.status(404).json({
          error: 'Brouillon non trouvé'
        });
      }

      // Préparer les données à mettre à jour
      const updateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (content !== undefined) {
        updateData.content = content;
      }

      // Mettre à jour le brouillon
      const updatedDraft = await prisma.story.update({
        where: { id: storyId },
        data: updateData,
        select: {
          id: true,
          title: true,
          content: true,
          updatedAt: true
        }
      });

      return res.json({
        message: 'Brouillon sauvegardé avec succès',
        draft: {
          id: updatedDraft.id,
          title: updatedDraft.title || 'Histoire sans titre',
          content: updatedDraft.content,
          lastModified: getTimeAgo(updatedDraft.updatedAt),
          status: 'Sauvegardé'
        }
      });
    }

    // Sinon, créer un nouveau brouillon
    const newDraft = await prisma.story.create({
      data: {
        title: title?.trim() || '',
        content: content || '',
        status: 'DRAFT',
        userId: userId
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Nouveau brouillon créé avec succès',
      draft: {
        id: newDraft.id,
        title: newDraft.title || 'Histoire sans titre',
        content: newDraft.content,
        lastModified: getTimeAgo(newDraft.createdAt),
        status: 'Créé'
      }
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde du brouillon:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la sauvegarde' });
  }
};

// Récupérer un brouillon spécifique pour édition
const getDraftById = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID d\'histoire invalide' });
    }

    const draft = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
        status: 'DRAFT'
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!draft) {
      return res.status(404).json({
        error: 'Brouillon non trouvé'
      });
    }

    res.json({
      message: 'Brouillon récupéré avec succès',
      draft: {
        id: draft.id,
        title: draft.title,
        content: draft.content,
        lastModified: getTimeAgo(draft.updatedAt),
        createdAt: draft.createdAt
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du brouillon:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les 6 derniers auteurs avec leur histoire la plus récente (public)
const getRecentAuthors = async (req, res) => {
  try {
    // Récupérer les 6 utilisateurs ayant publié le plus récemment
    const recentAuthors = await prisma.user.findMany({
      where: {
        stories: {
          some: {
            status: 'PUBLISHED'
          }
        }
      },
      include: {
        stories: {
          where: {
            status: 'PUBLISHED'
          },
          orderBy: {
            publishedAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            title: true,
            publishedAt: true
          }
        }
      },
      orderBy: {
        stories: {
          _count: 'desc'
        }
      },
      take: 6
    });

    // Formatter les données pour le frontend
    const formattedAuthors = recentAuthors
      .filter(author => author.stories.length > 0)
      .map(author => ({
        id: author.id,
        username: author.username,
        description: author.description || 'Écrivain martien',
        avatar: author.avatar || 'assets/images/default-avatar.png',
        latestStory: {
          id: author.stories[0].id,
          title: author.stories[0].title,
          slug: createSlugFromTitle(author.stories[0].title),
          publishedAt: author.stories[0].publishedAt?.toISOString() || new Date().toISOString()
        }
      }))
      .sort((a, b) => new Date(b.latestStory.publishedAt).getTime() - new Date(a.latestStory.publishedAt).getTime());

    res.json({
      message: 'Auteurs récents récupérés avec succès',
      authors: formattedAuthors,
      count: formattedAuthors.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des auteurs récents:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Fonctions utilitaires
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

function getStatusLabel(createdAt, updatedAt) {
  const diffMs = new Date(updatedAt) - new Date(createdAt);
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return 'Brouillon';
  if (diffHours < 24) return 'En cours';
  return 'En révision';
}

function formatPublishDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Fonction utilitaire pour créer un slug
function createSlugFromTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

module.exports = {
  getUserDrafts,
  getUserPublishedStories,
  getUserTotalLikes,
  publishStory,
  likeStory,
  archiveStory,
  saveDraft,
  getDraftById,
  getRecentAuthors
};