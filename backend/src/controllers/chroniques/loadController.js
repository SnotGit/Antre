const { PrismaClient } = require('@prisma/client');
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
      select: {
        id: true,
        title: true,
        content: true,
        publishedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            description: true
          }
        }
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    const storyReader = {
      id: story.id,
      title: story.title,
      content: story.content,
      publishDate: story.publishedAt.toISOString(),
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

    res.json({ stories: draftsList });

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
        updatedAt: true
      }
    });

    const publishedList = published.map(story => ({
      id: story.id,
      title: story.title,
      lastModified: story.updatedAt.toISOString()
    }));

    res.json({ stories: publishedList });

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
  getDrafts,
  getPublished,
  getDraftStory,
  getPublishedStory
};