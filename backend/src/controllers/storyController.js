// src/controllers/storyController.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Récupérer toutes les histoires (public)
const getAllStories = async (req, res) => {
  try {
    const stories = await prisma.story.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            description: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      message: 'Histoires récupérées avec succès',
      stories,
      count: stories.length
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer une histoire par ID (public)
const getStoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID d\'histoire invalide' });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            description: true,
            avatar: true
          }
        }
      }
    });

    if (!story) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    res.json({
      message: 'Histoire récupérée avec succès',
      story
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Créer une nouvelle histoire (authentifié)
const createStory = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.userId;

    // Vérifications
    if (!title || !content) {
      return res.status(400).json({ 
        error: 'Le titre et le contenu sont requis' 
      });
    }

    if (title.length > 200) {
      return res.status(400).json({ 
        error: 'Le titre ne peut pas dépasser 200 caractères' 
      });
    }

    // Créer l'histoire
    const newStory = await prisma.story.create({
      data: {
        title,
        content,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            description: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Histoire créée avec succès',
      story: newStory
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la création' });
  }
};

// Modifier une histoire (propriétaire ou admin)
const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID d\'histoire invalide' });
    }

    // Vérifier que l'histoire existe
    const existingStory = await prisma.story.findUnique({
      where: { id: storyId }
    });

    if (!existingStory) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (req.user.role !== 'admin' && existingStory.userId !== req.user.userId) {
      return res.status(403).json({ 
        error: 'Vous ne pouvez modifier que vos propres histoires' 
      });
    }

    // Préparer les données à mettre à jour
    const updateData = {};
    if (title !== undefined) {
      if (title.length > 200) {
        return res.status(400).json({ 
          error: 'Le titre ne peut pas dépasser 200 caractères' 
        });
      }
      updateData.title = title;
    }
    if (content !== undefined) {
      updateData.content = content;
    }

    // Mettre à jour l'histoire
    const updatedStory = await prisma.story.update({
      where: { id: storyId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            description: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      message: 'Histoire mise à jour avec succès',
      story: updatedStory
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
};

// Supprimer une histoire (propriétaire ou admin)
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'ID d\'histoire invalide' });
    }

    // Vérifier que l'histoire existe
    const existingStory = await prisma.story.findUnique({
      where: { id: storyId }
    });

    if (!existingStory) {
      return res.status(404).json({ error: 'Histoire non trouvée' });
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (req.user.role !== 'admin' && existingStory.userId !== req.user.userId) {
      return res.status(403).json({ 
        error: 'Vous ne pouvez supprimer que vos propres histoires' 
      });
    }

    // Supprimer l'histoire
    await prisma.story.delete({
      where: { id: storyId }
    });

    res.json({
      message: 'Histoire supprimée avec succès'
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
};

// Récupérer les histoires d'un utilisateur spécifique (public)
const getStoriesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ error: 'ID d\'utilisateur invalide' });
    }

    const stories = await prisma.story.findMany({
      where: { userId: userIdInt },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            description: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      message: 'Histoires de l\'utilisateur récupérées avec succès',
      stories,
      count: stories.length
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getAllStories,
  getStoryById,
  createStory,
  updateStory,
  deleteStory,
  getStoriesByUser
};