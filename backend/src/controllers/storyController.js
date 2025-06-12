const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

//============ USER SELECT ============
const userSelect = {
  id: true,
  username: true,
  description: true,
  avatar: true
};

//============ STORY QUERIES ============
const getAllStories = async (req, res) => {
  try {
    const stories = await prisma.story.findMany({
      where: { status: 'PUBLISHED' },
      include: { user: { select: userSelect } },
      orderBy: { publishedAt: 'desc' }
    });

    res.json({
      message: 'Histoires récupérées avec succès',
      stories,
      count: stories.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getStoryById = async (req, res) => {
  try {
    const story = await prisma.story.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: { select: userSelect } }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    res.json({
      message: 'Histoire récupérée avec succès',
      story
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getStoryBySlug = async (req, res) => {
  try {
    const story = await prisma.story.findFirst({
      where: { 
        slug: req.params.slug,
        status: 'PUBLISHED'
      },
      include: { 
        user: { 
          select: userSelect 
        } 
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    res.json({
      message: 'Histoire récupérée avec succès',
      story
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getStoriesByUser = async (req, res) => {
  try {
    const stories = await prisma.story.findMany({
      where: { 
        userId: parseInt(req.params.userId),
        status: 'PUBLISHED'
      },
      include: { user: { select: userSelect } },
      orderBy: { publishedAt: 'desc' }
    });

    res.json({
      message: 'Histoires de l\'utilisateur récupérées avec succès',
      stories,
      count: stories.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ STORY MUTATIONS ============
const createStory = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Titre et contenu requis' });
    }

    const story = await prisma.story.create({
      data: { title, content, userId: req.user.userId },
      include: { user: { select: userSelect } }
    });

    res.status(201).json({
      message: 'Histoire créée avec succès',
      story
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateStory = async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);
    const { title, content } = req.body;

    const existingStory = await prisma.story.findUnique({
      where: { id: storyId }
    });

    if (!existingStory) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    if (req.user.role !== 'admin' && existingStory.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const story = await prisma.story.update({
      where: { id: storyId },
      data: { title, content },
      include: { user: { select: userSelect } }
    });

    res.json({
      message: 'Histoire mise à jour avec succès',
      story
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteStory = async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);

    const existingStory = await prisma.story.findUnique({
      where: { id: storyId }
    });

    if (!existingStory) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    if (req.user.role !== 'admin' && existingStory.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    await prisma.story.delete({ where: { id: storyId } });

    res.json({ message: 'Histoire supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ LIKES ============
const likeStory = async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);
    const userId = req.user.userId;

    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    const existingLike = await prisma.like.findUnique({
      where: { userId_storyId: { userId, storyId } }
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { userId_storyId: { userId, storyId } }
      });
    } else {
      await prisma.like.create({
        data: { userId, storyId }
      });
    }

    const likesCount = await prisma.like.count({ where: { storyId } });

    res.json({
      message: existingLike ? 'Like retiré' : 'Histoire likée',
      isLiked: !existingLike,
      likesCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getLikeStatus = async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);
    const userId = req.user.userId;

    const existingLike = await prisma.like.findUnique({
      where: { userId_storyId: { userId, storyId } }
    });

    const likesCount = await prisma.like.count({ where: { storyId } });

    res.json({
      isLiked: !!existingLike,
      likesCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getAllStories,
  getStoryById,
  getStoryBySlug,
  createStory,
  updateStory,
  deleteStory,
  getStoriesByUser,
  likeStory,
  getLikeStatus
};