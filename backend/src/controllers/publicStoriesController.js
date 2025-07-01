const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const formatPublishDate = (date) => {
  const publishDate = new Date(date);
  return publishDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getLatestStories = async (req, res) => {
  try {
    const latestUserStories = await prisma.story.groupBy({
      by: ['userId'],
      where: {
        status: 'PUBLISHED'
      },
      _max: {
        updatedAt: true
      },
      orderBy: {
        _max: {
          updatedAt: 'desc'
        }
      },
      take: 6
    });

    const storiesData = await Promise.all(
      latestUserStories.map(async (group) => {
        return await prisma.story.findFirst({
          where: {
            userId: group.userId,
            status: 'PUBLISHED',
            updatedAt: group._max.updatedAt
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
      })
    );

    const formattedStories = storiesData.map(story => ({
      id: story.id,
      title: story.title,
      publishDate: formatPublishDate(story.updatedAt),
      likes: story._count.likes,
      slug: story.slug,
      user: {
        id: story.user.id,
        username: story.user.username,
        avatar: story.user.avatar,
        description: story.user.description
      }
    }));

    res.json({
      message: 'Dernières chroniques récupérées avec succès',
      stories: formattedStories,
      count: formattedStories.length
    });

  } catch (error) {
    console.error('Erreur getLatestStories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

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

    // Vérifier si l'user a des catégories
    const userCategories = await prisma.category.findMany({
      where: { userId: userId },
      include: {
        stories: {
          where: { status: 'PUBLISHED' },
          include: {
            _count: {
              select: { likes: true }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    if (userCategories.length > 0) {
      // Mode catégories : grille par catégories alphabétiques
      const formattedCategories = userCategories.map(category => ({
        id: category.id,
        name: category.name,
        stories: category.stories.map(story => ({
          id: story.id,
          title: story.title,
          publishDate: formatPublishDate(story.updatedAt),
          likes: story._count.likes,
          slug: story.slug
        }))
      }));

      const totalStories = userCategories.reduce((total, cat) => total + cat.stories.length, 0);

      res.json({
        message: 'Profil utilisateur récupéré avec succès',
        user: user,
        displayMode: 'categories',
        categories: formattedCategories,
        storiesCount: totalStories
      });

    } else {
      // Mode histoires : grille par date (comme avant)
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
        publishDate: formatPublishDate(story.updatedAt),
        likes: story._count.likes,
        slug: story.slug
      }));

      res.json({
        message: 'Profil utilisateur récupéré avec succès',
        user: user,
        displayMode: 'stories',
        stories: formattedStories,
        storiesCount: formattedStories.length
      });
    }

  } catch (error) {
    console.error('Erreur getUserProfile:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getLatestStories,
  getUserProfile
};