const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//======= UTILITIES =======

const handleError = (res, error) => {
  console.error(error);
  res.status(500).json({ error: 'Erreur serveur' });
};

const parseId = (id) => {
  const parsed = parseInt(id);
  if (isNaN(parsed)) throw new Error('ID invalide');
  return parsed;
};

const notFound = (res, message) => res.status(404).json({ error: message });
const badRequest = (res, message) => res.status(400).json({ error: message });

//======= PUBLIC QUERIES =======

const getLatest = async (_req, res) => {
  try {
    const stories = await prisma.story.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      distinct: ['userId'],
      take: 6,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        user: { select: { username: true, avatar: true } }
      }
    });

    const storyCards = stories.map(story => ({
      id: story.id,
      title: story.title,
      publishDate: story.publishedAt.toISOString(),
      user: story.user
    }));

    res.json({ stories: storyCards });
  } catch (error) {
    handleError(res, error);
  }
};

const getStory = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    const story = await prisma.story.findFirst({
      where: { id, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        content: true,
        publishedAt: true,
        user: {
          select: { id: true, username: true, avatar: true, description: true }
        }
      }
    });

    if (!story) return notFound(res, 'Histoire non trouvée');

    res.json({
      story: {
        ...story,
        publishDate: story.publishedAt.toISOString()
      }
    });
  } catch (error) {
    if (error.message === 'ID invalide') return badRequest(res, error.message);
    handleError(res, error);
  }
};

const getStories = async (req, res) => {
  try {
    const userId = parseId(req.params.userId);

    const stories = await prisma.story.findMany({
      where: { userId, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: { id: true, title: true }
    });

    res.json({ stories });
  } catch (error) {
    if (error.message === 'ID invalide') return badRequest(res, 'ID utilisateur invalide');
    handleError(res, error);
  }
};

//======= PRIVATE QUERIES =======

const getUserStories = async (userId, status, orderBy = 'updatedAt') => {
  return await prisma.story.findMany({
    where: { userId, status },
    orderBy: { [orderBy]: 'desc' },
    select: { id: true, title: true, updatedAt: true }
  });
};

const getUserStory = async (id, userId, status) => {
  return await prisma.story.findFirst({
    where: { id, userId, status },
    select: { id: true, title: true, content: true }
  });
};

const getDrafts = async (req, res) => {
  try {
    const drafts = await getUserStories(req.user.userId, 'DRAFT');
    
    const draftsList = drafts.map(draft => ({
      id: draft.id,
      title: draft.title,
      lastModified: draft.updatedAt.toISOString()
    }));

    res.json({ stories: draftsList });
  } catch (error) {
    handleError(res, error);
  }
};

const getPublished = async (req, res) => {
  try {
    const published = await getUserStories(req.user.userId, 'PUBLISHED', 'publishedAt');
    
    const publishedList = published.map(story => ({
      id: story.id,
      title: story.title,
      lastModified: story.updatedAt.toISOString()
    }));

    res.json({ stories: publishedList });
  } catch (error) {
    handleError(res, error);
  }
};

const getDraftStory = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const story = await getUserStory(id, req.user.userId, 'DRAFT');
    
    if (!story) return notFound(res, 'Brouillon non trouvé');
    
    res.json({ story });
  } catch (error) {
    if (error.message === 'ID invalide') return badRequest(res, error.message);
    handleError(res, error);
  }
};

const getPublishedStory = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const story = await getUserStory(id, req.user.userId, 'PUBLISHED');
    
    if (!story) return notFound(res, 'Histoire publiée non trouvée');
    
    res.json({ story });
  } catch (error) {
    if (error.message === 'ID invalide') return badRequest(res, error.message);
    handleError(res, error);
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