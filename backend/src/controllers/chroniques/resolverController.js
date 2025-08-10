const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//======= GET USER ID BY USERNAME =======

const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: 'Username requis' });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ userId: user.id });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= GET STORY ID BY TITLE (AUTH OPTIONNELLE) =======

const getStoryByTitle = async (req, res) => {
  try {
    const { title } = req.params;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Titre requis' });
    }

    const decodedTitle = decodeURIComponent(title).trim();

    // Si utilisateur connecté, chercher ses histoires privées
    if (req.user?.userId) {
      const story = await prisma.story.findFirst({
        where: {
          title: decodedTitle,
          userId: req.user.userId
        },
        select: { id: true }
      });

      if (story) {
        return res.json({ storyId: story.id });
      }
    }

    // Sinon chercher dans les histoires publiques
    const publicStory = await prisma.story.findFirst({
      where: {
        title: decodedTitle,
        status: 'PUBLISHED'
      },
      select: { id: true }
    });

    if (!publicStory) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    res.json({ storyId: publicStory.id });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= GET STORY ID BY USERNAME AND TITLE =======

const getStoryByUsernameAndTitle = async (req, res) => {
  try {
    const { username, title } = req.params;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: 'Username requis' });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Titre requis' });
    }

    const decodedTitle = decodeURIComponent(title).trim();

    const story = await prisma.story.findFirst({
      where: {
        title: decodedTitle,
        status: 'PUBLISHED',
        user: {
          username: username.trim()
        }
      },
      select: { id: true }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire publiée non trouvée' });
    }

    res.json({ storyId: story.id });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= EXPORT =======

module.exports = {
  getUserByUsername,
  getStoryByTitle,
  getStoryByUsernameAndTitle
};