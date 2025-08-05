const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//======= CREATE DRAFT =======

const createDraft = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title = '', content = '' } = req.body;

    const story = await prisma.story.create({
      data: {
        title,
        content,
        userId,
        status: 'DRAFT'
      },
      select: {
        id: true,
        title: true,
        content: true
      }
    });

    res.json({ story });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= SAVE DRAFT =======

const saveDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;
    const { title, content } = req.body;

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

    await prisma.story.update({
      where: { id: storyId },
      data: { title, content }
    });

    res.status(200).json({ message: 'Brouillon sauvegardé' });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= PUBLISH STORY =======

const publishStory = async (req, res) => {
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

    await prisma.story.update({
      where: { id: storyId },
      data: { 
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    });

    res.status(200).json({ message: 'Histoire publiée' });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= UPDATE STORY =======

const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;
    const { title, content } = req.body;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const story = await prisma.story.findFirst({
      where: { 
        id: storyId,
        userId: userId,
        status: 'PUBLISHED' 
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire publiée non trouvée' });
    }

    await prisma.story.update({
      where: { id: storyId },
      data: { title, content }
    });

    res.status(200).json({ message: 'Histoire mise à jour' });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= EXPORTS =======

module.exports = {
  createDraft,
  saveDraft,
  publishStory,
  updateStory
};