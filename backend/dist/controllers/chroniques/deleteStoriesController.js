"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStories = exports.deleteStory = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
//======= DELETE SINGLE STORY =======
const deleteStory = async (req, res) => {
    try {
        const story = req.story;
        await prisma.story.delete({
            where: { id: story.id }
        });
        (0, helpers_1.sendSuccess)(res, 'Histoire supprimée');
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la suppression de l\'histoire');
    }
};
exports.deleteStory = deleteStory;
//======= DELETE MULTIPLE STORIES =======
const deleteStories = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { storyIds } = req.body;
        if (!Array.isArray(storyIds) || storyIds.length === 0) {
            res.status(400).json({ error: 'IDs d\'histoires requis' });
            return;
        }
        const deletedCount = await prisma.story.deleteMany({
            where: {
                id: { in: storyIds },
                userId: userId
            }
        });
        (0, helpers_1.sendSuccess)(res, `${deletedCount.count} histoire(s) supprimée(s)`);
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la suppression des histoires');
    }
};
exports.deleteStories = deleteStories;
