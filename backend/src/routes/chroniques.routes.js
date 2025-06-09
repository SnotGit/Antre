const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

//============ GET LATEST STORIES ============
const getLatestStories = async (req, res) => {
  try {
    const usersWithStories = await prisma.user.findMany({
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
      take: 6
    });

    const formattedData = usersWithStories.map(user => ({
      id: user.id,
      username: user.username,
      description: user.description || 'Écrivain martien',
      avatar: user.avatar || null,
      latestStory: {
        id: user.stories[0].id,
        title: user.stories[0].title,
        slug: createSlug(user.stories[0].title),
        publishedAt: user.stories[0].publishedAt
      }
    }));

    res.json({
      message: 'Dernières histoires récupérées avec succès',
      users: formattedData
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
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ GET PUBLISHED STORIES ============
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
        publishedAt: 'desc'
      }
    });

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
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ GET TOTAL LIKES ============
const getTotalLikes = async (req, res) => {
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
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ PUBLISH STORY ============
const publishStory = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID d\'histoire invalide' });
    }

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
    res.status(500).json({ error: 'Erreur serveur lors de la publication' });
  }
};

//============ LIKE STORY ============
const likeStory = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID d\'histoire invalide' });
    }

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

    await prisma.like.create({
      data: {
        userId: userId,
        storyId: storyId
      }
    });

    const likesCount = await prisma.like.count({
      where: { storyId: storyId }
    });

    res.json({
      message: 'Histoire likée avec succès',
      likesCount: likesCount
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};



const saveDraft = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.userId;
    const { id } = req.params;

    if (id) {
      const storyId = parseInt(id);

      if (isNaN(storyId)) {
        return res.status(400).json({ error: 'ID d\'histoire invalide' });
      }

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

      const updateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (content !== undefined) {
        updateData.content = content;
      }

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
    res.status(500).json({ error: 'Erreur serveur lors de la sauvegarde' });
  }
};

//============ GET DRAFT BY ID ============
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

function getStatusLabel(createdAt, updatedAt) {
  const diffMs = new Date(updatedAt) - new Date(createdAt);
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return 'Brouillon';
  if (diffHours < 24) return 'En cours';
  return 'En révision';
}

function createSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

module.exports = {
  getLatestStories,
  getDrafts,
  getPublishedStories,
  getTotalLikes,
  publishStory,
  likeStory,
  saveDraft,
  getDraftById
};