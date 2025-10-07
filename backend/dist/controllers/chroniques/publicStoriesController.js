"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStories = exports.getUserStory = exports.getLatestStories = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
//======= GET LATEST STORIES =======
const getLatestStories = async (req, res) => {
    try {
        const stories = await prisma.story.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { publishedAt: 'desc' },
            distinct: ['userId'],
            take: 6,
            select: {
                id: true,
                title: true,
                publishedAt: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                }
            }
        });
        const storyCards = stories.map(story => ({
            id: story.id,
            title: story.title,
            publishDate: story.publishedAt.toISOString(),
            user: {
                id: story.user.id,
                username: story.user.username,
                avatar: story.user.avatar || ''
            }
        }));
        const response = { stories: storyCards };
        res.json(response);
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération des histoires');
    }
};
exports.getLatestStories = getLatestStories;
//======= GET SINGLE STORY =======
const getUserStory = async (req, res) => {
    try {
        const storyId = (0, helpers_1.parseStoryId)(req.params.id);
        if (storyId === null) {
            (0, helpers_1.sendNotFound)(res, 'Histoire non trouvée');
            return;
        }
        const story = await prisma.story.findFirst({
            where: {
                id: storyId,
                status: 'PUBLISHED'
            },
            select: {
                id: true,
                title: true,
                content: true,
                publishedAt: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        description: true
                    }
                }
            }
        });
        if (!story) {
            (0, helpers_1.sendNotFound)(res, 'Histoire non trouvée');
            return;
        }
        const likesCount = await prisma.like.count({
            where: { storyId: story.id }
        });
        let isliked = false;
        if (req.user?.userId) {
            const userLike = await prisma.like.findFirst({
                where: {
                    storyId: story.id,
                    userId: req.user.userId
                }
            });
            isliked = !!userLike;
        }
        const storyData = {
            id: story.id,
            title: story.title,
            content: story.content,
            publishDate: story.publishedAt.toISOString(),
            likes: likesCount,
            isliked,
            user: {
                id: story.user.id,
                username: story.user.username,
                avatar: story.user.avatar || '',
                description: story.user.description || ''
            }
        };
        res.json({ story: storyData });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération de l\'histoire');
    }
};
exports.getUserStory = getUserStory;
//======= GET USER STORIES =======
const getUserStories = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            (0, helpers_1.sendNotFound)(res, 'Utilisateur non trouvé');
            return;
        }
        const stories = await prisma.story.findMany({
            where: {
                userId: userId,
                status: 'PUBLISHED'
            },
            orderBy: { publishedAt: 'desc' },
            select: {
                id: true,
                title: true
            }
        });
        res.json({ stories });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération des histoires de l\'utilisateur');
    }
};
exports.getUserStories = getUserStories;
