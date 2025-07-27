const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//============ RÉSOLUTION USERNAME ============

const resolveUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
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

//============ RÉSOLUTION STORY ============

const resolveStory = async (req, res) => {
  try {
    const { username, title } = req.params;
    const urlTitle = decodeURIComponent(title);
    
    const searchTitle = urlTitle.replace(/-/g, ' ');

    const story = await prisma.story.findFirst({
      where: {
        title: searchTitle,
        status: 'PUBLISHED',
        user: { username }
      },
      select: { id: true, userId: true }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    res.json({ 
      storyId: story.id, 
      userId: story.userId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ GET LATEST STORIES ============

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
          orderBy: [
            { publishedAt: 'desc' },
            { updatedAt: 'desc' }
          ],
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
          publishDate: story.publishedAt 
            ? story.publishedAt.toLocaleDateString('fr-FR') 
            : story.createdAt.toLocaleDateString('fr-FR'),
          likes: story._count.likes,
          user: {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            description: user.description
          }
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.publishDate.split('/').reverse().join('-'));
        const dateB = new Date(b.publishDate.split('/').reverse().join('-'));
        return dateB.getTime() - dateA.getTime();
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

//============ GET STORY BY ID ============

const getStoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const currentUserId = req.user?.userId;

    const story = await prisma.story.findFirst({
      where: { id: storyId, status: 'PUBLISHED' },
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

    let isLiked = false;
    if (currentUserId) {
      const like = await prisma.like.findUnique({
        where: {
          userId_storyId: {
            userId: currentUserId,
            storyId: storyId
          }
        }
      });
      isLiked = !!like;
    }

    const formattedStory = {
      id: story.id,
      title: story.title,
      content: story.content,
      publishDate: story.publishedAt 
        ? story.publishedAt.toLocaleDateString('fr-FR')
        : story.createdAt.toLocaleDateString('fr-FR'),
      likes: story._count.likes,
      isliked: isLiked,
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

//============ GET USER STORIES ============

const getUserStories = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    const stories = await prisma.story.findMany({
      where: {
        userId: userId,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        publishedAt: true,
        createdAt: true,
        _count: {
          select: { likes: true }
        }
      },
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const formattedStories = stories.map(story => ({
      id: story.id,
      title: story.title,
      publishDate: story.publishedAt 
        ? story.publishedAt.toLocaleDateString('fr-FR')
        : story.createdAt.toLocaleDateString('fr-FR'),
      likes: story._count.likes
    }));

    res.json({
      message: 'Timeline utilisateur récupérée avec succès',
      stories: formattedStories,
      count: formattedStories.length
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ GET USER PROFILE ============

const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

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

    res.json({
      message: 'Profil utilisateur récupéré avec succès',
      user: user
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//============ EXPORTS ============

module.exports = {
  resolveUsername,
  resolveStory,
  getLatestStories,
  getStoryById,
  getUserStories,
  getUserProfile
};