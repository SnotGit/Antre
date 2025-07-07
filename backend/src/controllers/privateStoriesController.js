const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

//============ GÉNÉRATION SLUG ============

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

const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.story.findFirst({
      where: {
        slug: slug,
        ...(excludeId && { id: { not: excludeId } })
      }
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

//============ NOUVELLE MÉTHODE UNIFIÉE ============

const getStoryForEdit = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;

    if (!slug) {
      return res.status(400).json({ error: 'Slug requis' });
    }

    // 1. Cherche d'abord un draft avec ce slug
    const existingDraft = await prisma.story.findFirst({
      where: {
        slug: slug,
        userId: userId,
        status: 'DRAFT'
      }
    });

    if (existingDraft) {
      return res.json({
        message: 'Brouillon récupéré',
        story: existingDraft,
        originalStoryId: null
      });
    }

    // 2. Cherche une histoire publiée avec ce slug
    const publishedStory = await prisma.story.findFirst({
      where: {
        slug: slug,
        userId: userId,
        status: 'PUBLISHED'
      }
    });

    if (!publishedStory) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    // 3. Crée un nouveau draft à partir de l'histoire publiée
    const newDraft = await prisma.story.create({
      data: {
        title: publishedStory.title,
        content: publishedStory.content,
        slug: await ensureUniqueSlug(generateSlug(publishedStory.title)),
        status: 'DRAFT',
        userId: userId
      }
    });

    res.json({
      message: 'Nouveau brouillon créé pour édition',
      story: newDraft,
      originalStoryId: publishedStory.id
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ GESTION BROUILLONS ============

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
        slug: true,
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
      slug: draft.slug,
      lastModified: draft.updatedAt.toISOString(),
      status: draft.status
    }));

    res.json({
      message: 'Brouillons récupérés avec succès',
      drafts: formattedDrafts
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getDraftById = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID invalide' });
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
      message: 'Brouillon récupéré',
      story: story
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

    const storyTitle = title || 'Histoire sans titre';
    const baseSlug = generateSlug(storyTitle);

    if (id) {
      const storyId = parseInt(id);
      if (isNaN(storyId)) {
        return res.status(400).json({ error: 'ID invalide' });
      }

      const uniqueSlug = await ensureUniqueSlug(baseSlug, storyId);

      const updatedStory = await prisma.story.update({
        where: { id: storyId },
        data: {
          title: storyTitle,
          content: content,
          slug: uniqueSlug,
          updatedAt: new Date()
        }
      });

      res.json({
        message: 'Brouillon mis à jour',
        story: updatedStory
      });
    } else {
      const uniqueSlug = await ensureUniqueSlug(baseSlug);

      const newStory = await prisma.story.create({
        data: {
          title: storyTitle,
          content: content,
          slug: uniqueSlug,
          status: 'DRAFT',
          userId: userId
        }
      });

      res.json({
        message: 'Nouveau brouillon créé',
        story: newStory
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ GESTION HISTOIRES PUBLIÉES ============

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
      lastModified: story.updatedAt.toISOString(),
      likes: story._count.likes,
      slug: story.slug
    }));

    res.json({
      message: 'Histoires publiées récupérées',
      published: formattedStories
    });
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ GESTION ÉDITION HISTOIRES PUBLIÉES ============

const getPublishedForEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID histoire invalide' });
    }

    const publishedStory = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
        status: 'PUBLISHED'
      }
    });

    if (!publishedStory) {
      return res.status(404).json({ error: 'Histoire publiée non trouvée' });
    }

    const newDraft = await prisma.story.create({
      data: {
        title: publishedStory.title,
        content: publishedStory.content,
        slug: await ensureUniqueSlug(generateSlug(publishedStory.title)),
        status: 'DRAFT',
        userId: userId
      }
    });

    res.json({
      message: 'Nouveau brouillon créé pour édition',
      story: newDraft,
      originalStoryId: publishedStory.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const republishStory = async (req, res) => {
  try {
    const { draftId } = req.params;
    const { originalId } = req.body;
    const draftStoryId = parseInt(draftId);
    const originalStoryId = parseInt(originalId);
    const userId = req.user.userId;

    if (isNaN(draftStoryId) || isNaN(originalStoryId)) {
      return res.status(400).json({ error: 'IDs histoire invalides' });
    }

    const draftStory = await prisma.story.findFirst({
      where: {
        id: draftStoryId,
        userId: userId,
        status: 'DRAFT'
      }
    });

    const originalStory = await prisma.story.findFirst({
      where: {
        id: originalStoryId,
        userId: userId,
        status: 'PUBLISHED'
      }
    });

    if (!draftStory || !originalStory) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    await prisma.story.update({
      where: { id: originalStoryId },
      data: {
        title: draftStory.title,
        content: draftStory.content,
        updatedAt: new Date(),
        publishedAt: new Date()
      }
    });

    await prisma.story.delete({
      where: { id: draftStoryId }
    });

    res.json({
      message: 'Histoire mise à jour avec succès'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ GESTION SUPPRESSION ============

const deleteStory = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ STATISTIQUES ============

const getStats = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ EXPORTS ============

module.exports = {
  getDrafts,
  getPublishedStories,
  getStats,
  saveDraft,
  publishStory,
  deleteStory,
  getDraftById,
  getPublishedForEdit,
  republishStory,
  getStoryForEdit
};