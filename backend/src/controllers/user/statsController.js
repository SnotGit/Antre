const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//======= GET STATS =======

const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const draftsCount = await prisma.story.count({
      where: { 
        userId: userId,
        status: 'DRAFT' 
      }
    });

    const publishedCount = await prisma.story.count({
      where: { 
        userId: userId,
        status: 'PUBLISHED' 
      }
    });

    const totalLikes = await prisma.like.count({
      where: {
        story: {
          userId: userId,
          status: 'PUBLISHED'
        }
      }
    });

    const stats = {
      drafts: draftsCount,
      published: publishedCount,
      totalStories: draftsCount + publishedCount,
      totalLikes: totalLikes
    };

    res.json({ stats });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= EXPORTS =======

module.exports = {
  getStats
};