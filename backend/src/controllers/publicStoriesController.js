const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const formatPublishDate = (date) => {
  if (!date) {
    return 'Date non définie';
  }
  
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return 'Date invalide';
    }
    return parsedDate.toLocaleDateString('fr-FR');
  } catch (error) {
    return 'Erreur de format';
  }
};



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
          publishDate: formatPublishDate(story.publishedAt || story.createdAt),
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

const getStoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const story = await prisma.story.findUnique({
      where: { 
        id: parseInt(id),
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
      publishDate: formatPublishDate(story.publishedAt || story.createdAt),
      likes: story._count.likes,
      user: {
        id: story.user.id,
        username: story.user.username,
        avatar: story.user.avatar,
        description: story.user.description
      }
    };

    res.json({
      message: 'Histoire récupérée avec succès',
      story: formattedStory
    });

  } catch (error) {
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
      publishDate: formatPublishDate(story.publishedAt || story.createdAt),
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

const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID histoire invalide' });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { userId: true, status: true }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    if (story.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'Histoire non publiée' });
    }

    if (story.userId === userId) {
      return res.status(403).json({ 
        error: 'Vous ne pouvez pas liker votre propre histoire' 
      });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_storyId: {
          userId: userId,
          storyId: storyId
        }
      }
    });

    let isLiked;
    
    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      isLiked = false;
    } else {
      await prisma.like.create({
        data: {
          userId: userId,
          storyId: storyId
        }
      });
      isLiked = true;
    }

    const totalLikes = await prisma.like.count({
      where: { storyId: storyId }
    });

    res.json({
      success: true,
      liked: isLiked,
      totalLikes: totalLikes
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getLatestStories,
  getUserProfile,
  getStoryById,
  toggleLike
};