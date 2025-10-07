"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDraftStory = exports.getDraftStories = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
//======= GET ALL DRAFT STORIES =======
const getDraftStories = async (req, res) => {
    try {
        const userId = req.user.userId;
        const drafts = await prisma.story.findMany({
            where: {
                userId: userId,
                status: 'DRAFT'
            },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                updatedAt: true
            }
        });
        const draftsList = drafts.map(draft => ({
            id: draft.id,
            title: draft.title,
            lastModified: draft.updatedAt.toISOString()
        }));
        const response = { stories: draftsList };
        res.json(response);
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération des brouillons');
    }
};
exports.getDraftStories = getDraftStories;
//======= GET SINGLE DRAFT STORY =======
const getDraftStory = async (req, res) => {
    try {
        const storyId = req.storyId;
        const userId = req.user.userId;
        const story = await prisma.story.findFirst({
            where: {
                id: storyId,
                userId: userId,
                status: 'DRAFT'
            },
            select: {
                id: true,
                title: true,
                content: true
            }
        });
        if (!story) {
            (0, helpers_1.sendNotFound)(res, 'Brouillon non trouvé');
            return;
        }
        const editStory = {
            id: story.id,
            title: story.title,
            content: story.content
        };
        res.json({ story: editStory });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération du brouillon');
    }
};
exports.getDraftStory = getDraftStory;
