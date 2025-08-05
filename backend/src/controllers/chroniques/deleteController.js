const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//======= DELETE STORY =======

const deleteStory = async (req, res) => {
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
        userId: userId 
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    await prisma.story.delete({
      where: { id: storyId }
    });

    res.status(200).json({ message: 'Histoire supprimée' });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//======= EXPORTS =======

module.exports = {
  deleteStory
};