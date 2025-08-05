const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('./authController');

const prisma = new PrismaClient();

//======= GET LATEST =======

const getLatest = async (req, res) => {
  try {
    const stories = await prisma.story.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: {       
        id: true,
        title: true,
        publishedAt: true,
        user: {
          select: {
            username: true,
            avatar: true
          }
        }
      }
    });

    const storyCards = stories.map(story => ({
      id: story.id,
      title: story.title,
      publishDate: story.publishedAt.toISOString(),
      user: {
        username: story.user.username,
        avatar: story.user.avatar
      }
    }));

    res.json({ stories: storyCards });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= GET STORY =======

const getStory = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const story = await prisma.story.findFirst({
      where: { 
        id: storyId,
        status: 'PUBLISHED' 
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            description: true
          }
        },
        likes: true
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let currentUserId = null;

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt-temporaire');
        currentUserId = decoded.userId;
      } catch (error) {
        // Token invalide, utilisateur non connecté
      }
    }

    const isLiked = currentUserId ? 
      story.likes.some(like => like.userId === currentUserId) : false;

    const storyReader = {
      id: story.id,
      title: story.title,
      content: story.content,
      publishDate: story.publishedAt.toISOString(),
      likes: story.likes.length,
      isliked: isLiked,
      user: {
        id: story.user.id,
        username: story.user.username,
        avatar: story.user.avatar,
        description: story.user.description
      }
    };

    res.json({ story: storyReader });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= GET STORIES =======

const getStories = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }

    const stories = await prisma.story.findMany({
      where: { 
        userId: userIdInt,
        status: 'PUBLISHED' 
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true
      }
    });

    res.json({ stories });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= GET STATS =======

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

    const stats = {
      drafts: draftsCount,
      published: publishedCount,
      totalLikes: totalLikes
    };

    res.json({ stats });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= GET DRAFTS =======

const getDrafts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const drafts = await prisma.story.findMany({
      where: { 
        userId: userId,
        status: 'DRAFT' 
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true
      }
    });

    const draftsList = drafts.map(draft => ({
      id: draft.id,
      title: draft.title,
      lastModified: draft.updatedAt.toISOString()
    }));

    res.json({ drafts: draftsList });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= GET PUBLISHED =======

const getPublished = async (req, res) => {
  try {
    const userId = req.user.userId;

    const published = await prisma.story.findMany({
      where: { 
        userId: userId,
        status: 'PUBLISHED' 
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        likes: true
      }
    });

    const publishedList = published.map(story => ({
      id: story.id,
      title: story.title,
      lastModified: story.updatedAt.toISOString(),
      likes: story.likes.length
    }));

    res.json({ published: publishedList });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= GET DRAFT STORY =======

const getDraftStory = async (req, res) => {
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
      },
      select: {
        id: true,
        title: true,
        content: true
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Brouillon non trouvé' });
    }

    res.json({ story });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= GET PUBLISHED STORY =======

const getPublishedStory = async (req, res) => {
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
        status: 'PUBLISHED' 
      },
      select: {
        id: true,
        title: true,
        content: true
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire publiée non trouvée' });
    }

    res.json({ story });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= EXPORTS =======

module.exports = {
  getLatest,
  getStory,
  getStories,
  getStats,
  getDrafts,
  getPublished,
  getDraftStory,
  getPublishedStory
};