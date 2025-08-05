const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//======= TOGGLE LIKE =======

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
  toggleLike
};