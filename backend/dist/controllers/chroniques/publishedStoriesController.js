"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishedStory = exports.getPublishedStories = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
//======= GET PUBLISHED STORIES =======
const getPublishedStories = async (req, res) => {
    try {
        const userId = req.user.userId;
        const published = await prisma.story.findMany({
            where: {
                userId: userId,
                status: 'PUBLISHED'
            },
            orderBy: { publishedAt: 'desc' },
            select: {
                id: true,
                title: true,
                updatedAt: true
            }
        });
        const publishedList = await Promise.all(published.map(async (story) => {
            const likesCount = await prisma.like.count({
                where: { storyId: story.id }
            });
            return {
                id: story.id,
                title: story.title,
                lastModified: story.updatedAt.toISOString(),
                likes: likesCount
            };
        }));
        const response = { stories: publishedList };
        res.json(response);
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération des histoires publiées');
    }
};
exports.getPublishedStories = getPublishedStories;
//======= GET SINGLE PUBLISHED STORY =======
const getPublishedStory = async (req, res) => {
    try {
        const storyId = req.storyId;
        const userId = req.user.userId;
        const story = await prisma.story.findFirst({
            where: {
                id: storyId,
                userId: userId,
                status: 'PUBLISHED'
            },
            select: {
                id: true,
                title: true,
                content: true
            }
        });
        if (!story) {
            (0, helpers_1.sendNotFound)(res, 'Histoire publiée non trouvée');
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
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération de l\'histoire publiée');
    }
};
exports.getPublishedStory = getPublishedStory;
