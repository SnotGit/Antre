const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//============ VALIDATION ============

const validateStory = (title, content) => {
  if (!title?.trim() || !content?.trim()) return 'Titre et contenu requis';
  return null;
};

//============ RESOLVE ============

const resolveTitle = async (req, res) => {
  try {
    const { title } = req.params;
    const userId = req.user.userId;
    const decodedTitle = decodeURIComponent(title);

    const existingDraft = await prisma.story.findFirst({
      where: { 
        title: decodedTitle, 
        userId, 
        status: 'DRAFT' 
      },
      select: { id: true, status: true }
    });

    if (existingDraft) {
      return res.json({ 
        id: existingDraft.id, 
        status: existingDraft.status 
      });
    }

    const publishedStory = await prisma.story.findFirst({
      where: { 
        title: decodedTitle, 
        userId, 
        status: 'PUBLISHED' 
      },
      select: { id: true, status: true }
    });

    if (!publishedStory) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    res.json({ 
      id: publishedStory.id, 
      status: publishedStory.status 
    });

  } catch (error) {
    console.error('Resolve title error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ EDIT  ============

const getStoryForEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const storyId = parseInt(id);

    const story = await prisma.story.findFirst({
      where: { id: storyId, userId }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    if (story.status === 'DRAFT') {
      return res.json({
        story: {
          id: story.id,
          title: story.title,
          content: story.content
        }
      });
    }

    if (story.status === 'PUBLISHED') {
      
      const existingDraft = await prisma.story.findFirst({
        where: {
          title: story.title,
          userId,
          status: 'DRAFT'
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (existingDraft) {
        return res.json({
          story: {
            id: existingDraft.id,
            title: existingDraft.title,
            content: existingDraft.content
          },
          originalStoryId: story.id
        });
      }

      const draft = await prisma.story.create({
        data: {
          title: story.title,
          content: story.content,
          status: 'DRAFT',
          userId
        }
      });

      return res.json({
        story: {
          id: draft.id,
          title: draft.title,
          content: draft.content
        },
        originalStoryId: story.id
      });
    }

  } catch (error) {
    console.error('Get story for edit error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ CRUD ============

const createDraft = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.userId;

    const error = validateStory(title, content);
    if (error) return res.status(400).json({ error });

    const story = await prisma.story.create({
      data: { title: title.trim(), content: content.trim(), status: 'DRAFT', userId }
    });

    res.json({
      message: 'Brouillon créé avec succès',
      story: { id: story.id, title: story.title, content: story.content, status: story.status }
    });
  } catch (error) {
    console.error('Create draft error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.userId;
    const storyId = parseInt(id);

    const error = validateStory(title, content);
    if (error) return res.status(400).json({ error });

    const story = await prisma.story.findFirst({
      where: { id: storyId, userId, status: 'DRAFT' }
    });

    if (!story) return res.status(404).json({ error: 'Brouillon non trouvé' });

    const updated = await prisma.story.update({
      where: { id: storyId },
      data: { title: title.trim(), content: content.trim(), updatedAt: new Date() }
    });

    res.json({
      message: 'Brouillon mis à jour avec succès',
      story: { id: updated.id, title: updated.title, content: updated.content, status: updated.status }
    });
  } catch (error) {
    console.error('Update draft error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ PUBLISH ============

const publishStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const storyId = parseInt(id);

    const story = await prisma.story.findFirst({
      where: { id: storyId, userId, status: 'DRAFT' }
    });

    if (!story) return res.status(404).json({ error: 'Brouillon non trouvé' });

    const error = validateStory(story.title, story.content);
    if (error) return res.status(400).json({ error });

    await prisma.story.update({
      where: { id: storyId },
      data: { status: 'PUBLISHED', publishedAt: new Date() }
    });

    res.json({ message: 'Histoire publiée avec succès' });
  } catch (error) {
    console.error('Publish story error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateOriginalStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { originalStoryId } = req.body;
    const userId = req.user.userId;
    const draftId = parseInt(id);
    const originalId = parseInt(originalStoryId);

    const [draft, originalStory] = await Promise.all([
      prisma.story.findFirst({ where: { id: draftId, userId, status: 'DRAFT' } }),
      prisma.story.findFirst({ where: { id: originalId, userId, status: 'PUBLISHED' } })
    ]);

    if (!draft || !originalStory) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    const error = validateStory(draft.title, draft.content);
    if (error) return res.status(400).json({ error });

    await prisma.$transaction([
      prisma.story.update({
        where: { id: originalId },
        data: {
          title: draft.title,
          content: draft.content,
          updatedAt: new Date()
        }
      }),
      prisma.story.delete({ where: { id: draftId } })
    ]);

    res.json({ message: 'Histoire originale mise à jour avec succès' });
  } catch (error) {
    console.error('Update original story error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ DELETE TRANSACTIONNEL CORRIGÉ ============

const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const storyId = parseInt(id);

    //============ VALIDATION INPUT ============
    
    if (!id || isNaN(storyId) || storyId <= 0) {
      return res.status(400).json({ 
        error: 'ID histoire invalide',
        code: 'INVALID_ID'
      });
    }

    if (!userId || typeof userId !== 'number') {
      return res.status(401).json({ 
        error: 'Utilisateur non authentifié',
        code: 'INVALID_USER'
      });
    }

    //============ VERIFICATION OWNERSHIP ============
    
    const story = await prisma.story.findFirst({
      where: { 
        id: storyId,
        userId: userId
      },
      select: { 
        id: true, 
        status: true, 
        title: true,
        userId: true
      }
    });

    if (!story) {
      return res.status(404).json({ 
        error: 'Histoire non trouvée ou accès non autorisé',
        code: 'STORY_NOT_FOUND'
      });
    }

    //============ SUPPRESSION TRANSACTIONNELLE ============
    
    await prisma.$transaction(async (tx) => {
      await tx.like.deleteMany({
        where: { storyId: storyId }
      });

      await tx.story.delete({
        where: { id: storyId }
      });
    });

    //============ RESPONSE SUCCESS ============
    
    res.json({
      success: true,
      message: `${story.status === 'DRAFT' ? 'Brouillon' : 'Histoire'} supprimé avec succès`,
      deletedStory: {
        id: story.id,
        title: story.title,
        status: story.status
      }
    });

  } catch (error) {
    console.error('Delete story error:', error);

    //============ GESTION ERREURS PRISMA ============
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Conflit de contrainte lors de la suppression',
        code: 'CONSTRAINT_VIOLATION'
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Histoire introuvable pour suppression',
        code: 'RECORD_NOT_FOUND'
      });
    }

    if (error.code === 'P2023') {
      return res.status(400).json({ 
        error: 'ID histoire invalide',
        code: 'INVALID_ID_FORMAT'
      });
    }

    //============ ERREUR GENERIQUE ============
    
    res.status(500).json({ 
      error: 'Erreur lors de la suppression',
      code: 'DELETE_FAILED'
    });
  }
};

//============ STATS ============

const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [drafts, published, totalLikes] = await Promise.all([
      prisma.story.count({ where: { userId, status: 'DRAFT' } }),
      prisma.story.count({ where: { userId, status: 'PUBLISHED' } }),
      prisma.like.count({ where: { story: { userId, status: 'PUBLISHED' } } })
    ]);

    res.json({
      message: 'Statistiques récupérées avec succès',
      stats: { drafts, published, totalLikes }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getDrafts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const drafts = await prisma.story.findMany({
      where: { userId, status: 'DRAFT' },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      message: 'Brouillons récupérés avec succès',
      drafts: drafts.map(d => ({
        id: d.id,
        title: d.title,
        lastModified: d.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getPublishedStories = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stories = await prisma.story.findMany({
      where: { userId, status: 'PUBLISHED' },
      select: { id: true, title: true, updatedAt: true, _count: { select: { likes: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      message: 'Histoires publiées récupérées avec succès',
      published: stories.map(s => ({
        id: s.id,
        title: s.title,
        lastModified: s.updatedAt.toISOString(),
        likes: s._count.likes
      }))
    });
  } catch (error) {
    console.error('Get published stories error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ LIKES ============

const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { userId: true, status: true }
    });

    if (!story || story.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    if (story.userId === userId) {
      return res.status(403).json({ error: 'Vous ne pouvez pas liker votre propre histoire' });
    }

    const existingLike = await prisma.like.findUnique({
      where: { userId_storyId: { userId, storyId } }
    });

    let isLiked;
    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      isLiked = false;
    } else {
      await prisma.like.create({ data: { userId, storyId } });
      isLiked = true;
    }

    const totalLikes = await prisma.like.count({ where: { storyId } });

    res.json({
      success: true,
      liked: isLiked,
      totalLikes,
      message: isLiked ? 'Histoire likée' : 'Like retiré'
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ EXPORTS ============

module.exports = {
  resolveTitle,
  getStats,
  getStoryForEdit,
  createDraft,
  updateDraft,
  publishStory,
  updateOriginalStory,
  deleteStory,
  getDrafts,
  getPublishedStories,
  toggleLike
};