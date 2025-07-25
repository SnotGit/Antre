const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//============ VALIDATION ============

const validateStory = (title, content) => {
  if (!title?.trim() || !content?.trim()) return 'Titre et contenu requis';
  return null;
};

//============ RESOLVER ============

const resolveTitle = async (req, res) => {
  try {
    const { title } = req.params;
    const userId = req.user.userId;
    const decodedTitle = decodeURIComponent(title);

    const story = await prisma.story.findFirst({
      where: { title: decodedTitle, userId },
      select: { id: true, status: true }
    });

    if (!story) return res.status(404).json({ error: 'Histoire non trouvée' });

    res.json({ id: story.id, status: story.status });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ LOADING ============

const loadDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const storyId = parseInt(id);

    const story = await prisma.story.findFirst({
      where: { id: storyId, userId, status: 'DRAFT' }
    });

    if (!story) return res.status(404).json({ error: 'Brouillon non trouvé' });

    res.json({
      story: { title: story.title, content: story.content },
      mode: 'EditDraft',
      storyId: story.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const loadPublishedToDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const storyId = parseInt(id);

    const original = await prisma.story.findFirst({
      where: { id: storyId, userId, status: 'PUBLISHED' }
    });

    if (!original) return res.status(404).json({ error: 'Histoire non trouvée' });

    const draft = await prisma.story.create({
      data: {
        title: original.title,
        content: original.content,
        status: 'DRAFT',
        userId
      }
    });

    res.json({
      story: { title: draft.title, content: draft.content },
      mode: 'EditPublished',
      storyId: draft.id,
      originalStoryId: original.id
    });
  } catch (error) {
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

    res.json({ story: { id: story.id, title: story.title, content: story.content } });
  } catch (error) {
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

    res.json({ story: { id: updated.id, title: updated.title, content: updated.content } });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

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

    res.json({ message: 'Histoire publiée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateOriginal = async (req, res) => {
  try {
    const { id } = req.params;
    const { originalId } = req.body;
    const userId = req.user.userId;
    const draftId = parseInt(id);
    const originalStoryId = parseInt(originalId);

    const [draft, original] = await Promise.all([
      prisma.story.findFirst({ where: { id: draftId, userId, status: 'DRAFT' } }),
      prisma.story.findFirst({ where: { id: originalStoryId, userId, status: 'PUBLISHED' } })
    ]);

    if (!draft || !original) return res.status(404).json({ error: 'Histoire non trouvée' });

    const error = validateStory(draft.title, draft.content);
    if (error) return res.status(400).json({ error });

    await prisma.$transaction([
      prisma.story.update({
        where: { id: originalStoryId },
        data: { title: draft.title, content: draft.content, updatedAt: new Date() }
      }),
      prisma.story.delete({ where: { id: draftId } })
    ]);

    res.json({ message: 'Histoire mise à jour' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const storyId = parseInt(id);

    const story = await prisma.story.findFirst({
      where: { id: storyId, userId }
    });

    if (!story) return res.status(404).json({ error: 'Histoire non trouvée' });

    await prisma.story.delete({ where: { id: storyId } });

    res.json({ message: 'Histoire supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ LISTS ============

const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [drafts, published, totalLikes] = await Promise.all([
      prisma.story.count({ where: { userId, status: 'DRAFT' } }),
      prisma.story.count({ where: { userId, status: 'PUBLISHED' } }),
      prisma.like.count({ where: { story: { userId, status: 'PUBLISHED' } } })
    ]);

    res.json({ stats: { drafts, published, totalLikes } });
  } catch (error) {
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
      drafts: drafts.map(d => ({
        id: d.id,
        title: d.title,
        lastModified: d.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getPublished = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stories = await prisma.story.findMany({
      where: { userId, status: 'PUBLISHED' },
      select: { id: true, title: true, updatedAt: true, _count: { select: { likes: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      published: stories.map(s => ({
        id: s.id,
        title: s.title,
        lastModified: s.updatedAt.toISOString(),
        likes: s._count.likes
      }))
    });
  } catch (error) {
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

    res.json({ success: true, liked: isLiked, totalLikes });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ EXPORTS ============

module.exports = {
  resolveTitle,
  loadDraft,
  loadPublishedToDraft,
  getStoryForEdit,
  createDraft,
  updateDraft,
  publishStory,
  updateOriginal,
  deleteStory,
  getStats,
  getDrafts,
  getPublished,
  toggleLike
};