const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

//============ GESTION BROUILLONS ============

const getDrafts = async (req, res) => {
  const userId = req.user.userId;

  const drafts = await prisma.story.findMany({
    where: {
      userId: userId,
      status: 'DRAFT'
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      status: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  const formattedDrafts = drafts.map(draft => ({
    id: draft.id,
    title: draft.title,
    lastModified: draft.updatedAt.toISOString(),
    status: draft.status
  }));

  res.json({
    message: 'Brouillons récupérés avec succès',
    drafts: formattedDrafts
  });
};

const saveDraft = async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.userId;
  const { id } = req.params;

  if (id) {
    const storyId = parseInt(id);
    
    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID histoire invalide' });
    }

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
};

const getDraftById = async (req, res) => {
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
};

//============ GESTION HISTOIRES PUBLIÉES ============

const getPublishedStories = async (req, res) => {
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
    lastModified: story.updatedAt.toISOString(),
    likes: story._count.likes
  }));

  res.json({
    message: 'Histoires publiées récupérées',
    published: formattedStories
  });
};

const publishStory = async (req, res) => {
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

  if (!story.title.trim() || !story.content.trim()) {
    return res.status(400).json({ error: 'Titre et contenu requis pour publication' });
  }

  const updatedStory = await prisma.story.update({
    where: { id: storyId },
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
};

//============ GESTION SUPPRESSION ============

const deleteStory = async (req, res) => {
  const { id } = req.params;
  const storyId = parseInt(id);
  const userId = req.user.userId;

  if (isNaN(storyId)) {
    return res.status(400).json({ error: 'ID histoire invalide' });
  }

  const story = await prisma.story.findFirst({
    where: {
      id: storyId,
      userId: userId
    }
  });

  if (!story) {
    return res.status(404).json({ error: 'Histoire non trouvée' });
  }

  await prisma.story.delete({
    where: { id: storyId }
  });

  res.json({
    message: 'Histoire supprimée avec succès'
  });
};

//============ STATISTIQUES ============

const getStats = async (req, res) => {
  const userId = req.user.userId;

  const [draftsCount, publishedCount, totalLikes] = await Promise.all([
    prisma.story.count({
      where: {
        userId: userId,
        status: 'DRAFT'
      }
    }),
    prisma.story.count({
      where: {
        userId: userId,
        status: 'PUBLISHED'
      }
    }),
    prisma.like.count({
      where: {
        story: {
          userId: userId,
          status: 'PUBLISHED'
        }
      }
    })
  ]);

  res.json({
    message: 'Statistiques récupérées avec succès',
    stats: {
      drafts: draftsCount,
      published: publishedCount,
      totalLikes: totalLikes
    }
  });
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