"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStory = exports.publishStory = exports.saveDraft = exports.createDraft = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
//======= CREATE DRAFT =======
const createDraft = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { title = '', content = '', originalStoryId } = req.body;
        const story = await prisma.story.create({
            data: {
                title,
                content,
                userId,
                status: 'DRAFT',
                ...(originalStoryId && { originalStoryId })
            },
            select: {
                id: true,
                title: true,
                content: true
            }
        });
        const response = { story };
        res.json(response);
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la création du brouillon');
    }
};
exports.createDraft = createDraft;
//======= SAVE DRAFT =======
const saveDraft = async (req, res) => {
    try {
        const { id } = req.params;
        const storyId = (0, helpers_1.parseStoryId)(id);
        const userId = req.user.userId;
        const { title, content } = req.body;
        if (storyId === null) {
            return (0, helpers_1.sendError)(res, 'ID invalide', 400);
        }
        const story = await prisma.story.findFirst({
            where: {
                id: storyId,
                userId: userId,
                status: 'DRAFT'
            }
        });
        if (!story) {
            return (0, helpers_1.sendNotFound)(res, 'Brouillon non trouvé');
        }
        await prisma.story.update({
            where: { id: storyId },
            data: { title, content }
        });
        (0, helpers_1.sendSuccess)(res, 'Brouillon sauvegardé');
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la sauvegarde du brouillon');
    }
};
exports.saveDraft = saveDraft;
//======= PUBLISH STORY =======
const publishStory = async (req, res) => {
    try {
        const { id } = req.params;
        const storyId = (0, helpers_1.parseStoryId)(id);
        const userId = req.user.userId;
        if (storyId === null) {
            return (0, helpers_1.sendError)(res, 'ID invalide', 400);
        }
        const story = await prisma.story.findFirst({
            where: {
                id: storyId,
                userId: userId,
                status: 'DRAFT'
            }
        });
        if (!story) {
            return (0, helpers_1.sendNotFound)(res, 'Brouillon non trouvé');
        }
        await prisma.story.update({
            where: { id: storyId },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date()
            }
        });
        (0, helpers_1.sendSuccess)(res, 'Histoire publiée');
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la publication de l\'histoire');
    }
};
exports.publishStory = publishStory;
//======= UPDATE STORY =======
const updateStory = async (req, res) => {
    try {
        const { id } = req.params;
        const storyId = (0, helpers_1.parseStoryId)(id);
        const userId = req.user.userId;
        const { title, content } = req.body;
        if (storyId === null) {
            return (0, helpers_1.sendError)(res, 'ID invalide', 400);
        }
        const story = await prisma.story.findFirst({
            where: {
                id: storyId,
                userId: userId,
                status: 'PUBLISHED'
            }
        });
        if (!story) {
            return (0, helpers_1.sendNotFound)(res, 'Histoire publiée non trouvée');
        }
        await prisma.story.update({
            where: { id: storyId },
            data: { title, content }
        });
        (0, helpers_1.sendSuccess)(res, 'Histoire mise à jour');
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la mise à jour de l\'histoire');
    }
};
exports.updateStory = updateStory;
