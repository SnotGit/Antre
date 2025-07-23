const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//============ DERNIÈRES HISTOIRES ============

const getLatestStories = async (req, res) => {
  try {
    const latestStories = await prisma.user.findMany({
      where: {
        stories: {
          some: {
            status: 'PUBLISHED'
          }
        }
      },
      include: {
        stories: {
          where: { status: 'PUBLISHED' },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          include: {
            _count: {
              select: { likes: true }
            }
          }
        }
      }
    });

    const formattedStories = latestStories
      .filter(user => user.stories.length > 0)
      .map(user => {
        const story = user.stories[0];
        return {
          id: story.id,
          title: story.title,
          publishDate: story.publishedAt ? story.publishedAt.toLocaleDateString('fr-FR') : story.createdAt.toLocaleDateString('fr-FR'),
          likes: story._count.likes,
          user: {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            description: user.description
          }
        };
      });

    res.json({
      message: 'Dernières chroniques récupérées avec succès',
      stories: formattedStories,
      count: formattedStories.length
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ HISTOIRE PAR USERNAME + TITRE ============

const getStoryByUsernameAndTitle = async (req, res) => {
  try {
    const { username, title } = req.params;
    const decodedTitle = decodeURIComponent(title);

    const story = await prisma.story.findFirst({
      where: {
        title: decodedTitle,
        status: 'PUBLISHED',
        user: {
          username: username
        }
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
        _count: {
          select: { likes: true }
        }
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    const formattedStory = {
      id: story.id,
      title: story.title,
      content: story.content,
      publishDate: story.publishedAt ? story.publishedAt.toLocaleDateString('fr-FR') : story.createdAt.toLocaleDateString('fr-FR'),
      likes: story._count.likes,
      user: story.user
    };

    res.json({
      message: 'Histoire récupérée avec succès',
      story: formattedStory
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ PROFIL UTILISATEUR ============

const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
        description: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const userStories = await prisma.story.findMany({
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
        updatedAt: 'desc'
      }
    });

    const formattedStories = userStories.map(story => ({
      id: story.id,
      title: story.title,
      publishDate: story.publishedAt ? story.publishedAt.toLocaleDateString('fr-FR') : story.createdAt.toLocaleDateString('fr-FR'),
      likes: story._count.likes
    }));

    res.json({
      message: 'Profil utilisateur récupéré avec succès',
      user: user,
      stories: formattedStories,
      storiesCount: formattedStories.length
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ EXPORTS ============

module.exports = {
  getLatestStories,
  getStoryByUsernameAndTitle,
  getUserProfile
};