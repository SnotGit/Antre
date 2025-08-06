const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//======= HELPERS =======

const handleError = (res, error) => {
  console.error(error);
  res.status(500).json({ error: 'Erreur serveur' });
};

//======= GET /api/user/stats =======

const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [drafts, published, totalLikes] = await Promise.all([
      prisma.story.count({
        where: { userId, status: 'DRAFT' }
      }),
      prisma.story.count({
        where: { userId, status: 'PUBLISHED' }
      }),
      prisma.like.count({
        where: {
          story: { userId, status: 'PUBLISHED' }
        }
      })
    ]);

    res.json({
      stats: {
        drafts,
        published,
        totalStories: drafts + published,
        totalLikes
      }
    });

  } catch (error) {
    handleError(res, error);
  }
};

//======= EXPORTS =======

module.exports = {
  getStats
};