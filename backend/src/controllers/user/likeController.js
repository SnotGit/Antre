const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//======= GET LIKE COUNT (PUBLIC) =======

const getLikes = async (req, res) => {
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
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    const likesCount = await prisma.like.count({
      where: { storyId: storyId }
    });

    res.json({ storyId, likesCount });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= GET TOTAL LIKES FOR USER (PUBLIC) =======

const getTotalLikes = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }

    const totalLikes = await prisma.like.count({
      where: {
        story: {
          userId: userIdInt,
          status: 'PUBLISHED'
        }
      }
    });

    res.json({ userId: userIdInt, totalLikes });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= GET STORY WITH LIKE STATUS =======

const getStoryLikeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);
    const userId = req.user?.userId;

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const story = await prisma.story.findFirst({
      where: { 
        id: storyId,
        status: 'PUBLISHED' 
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    const likesCount = await prisma.like.count({
      where: { storyId: storyId }
    });

    let isLiked = false;
    if (userId) {
      const existingLike = await prisma.like.findFirst({
        where: {
          storyId: storyId,
          userId: userId
        }
      });
      isLiked = !!existingLike;
    }

    res.json({ 
      storyId, 
      likesCount, 
      isLiked 
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= TOGGLE LIKE (PRIVATE) =======

const toggleLike = async (req, res) => {
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
        status: 'PUBLISHED' 
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    if (story.userId === userId) {
      return res.status(403).json({ error: 'Impossible de liker ses propres histoires' });
    }

    const existingLike = await prisma.like.findFirst({
      where: {
        storyId: storyId,
        userId: userId
      }
    });

    let liked;

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      liked = false;
    } else {
      await prisma.like.create({
        data: {
          storyId: storyId,
          userId: userId
        }
      });
      liked = true;
    }

    const likesCount = await prisma.like.count({
      where: { storyId: storyId }
    });

    res.json({ liked, likesCount });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= EXPORTS =======

module.exports = {
  getLikes,
  getTotalLikes,
  getStoryLikeStatus,
  toggleLike
};