"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostedLikes = exports.toggleLike = exports.getStatus = exports.getCount = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
//======= HELPER =======
const getPublishedStory = async (storyId) => {
    return await prisma.story.findFirst({
        where: { id: storyId, status: 'PUBLISHED' }
    });
};
//======= GET COUNT (PUBLIC) =======
const getCount = async (req, res) => {
    try {
        const storyId = (0, helpers_1.parseStoryId)(req.params.id);
        if (storyId === null)
            return (0, helpers_1.sendError)(res, 'ID invalide', 400);
        const story = await getPublishedStory(storyId);
        if (!story)
            return (0, helpers_1.sendNotFound)(res, 'Histoire non trouvée');
        const likesCount = await prisma.like.count({ where: { storyId } });
        res.json({ storyId, likesCount });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération du nombre de likes');
    }
};
exports.getCount = getCount;
//======= GET STATUS (PRIVATE) =======
const getStatus = async (req, res) => {
    try {
        const storyId = (0, helpers_1.parseStoryId)(req.params.id);
        if (storyId === null)
            return (0, helpers_1.sendError)(res, 'ID invalide', 400);
        const story = await getPublishedStory(storyId);
        if (!story)
            return (0, helpers_1.sendNotFound)(res, 'Histoire non trouvée');
        const userId = req.user.userId;
        const existingLike = await prisma.like.findFirst({ where: { storyId, userId } });
        res.json({
            storyId,
            isLiked: !!existingLike
        });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la vérification du statut du like');
    }
};
exports.getStatus = getStatus;
//======= TOGGLE LIKE (PRIVATE) =======
const toggleLike = async (req, res) => {
    try {
        const storyId = (0, helpers_1.parseStoryId)(req.params.id);
        if (storyId === null)
            return (0, helpers_1.sendError)(res, 'ID invalide', 400);
        const story = await getPublishedStory(storyId);
        if (!story)
            return (0, helpers_1.sendNotFound)(res, 'Histoire non trouvée');
        const userId = req.user.userId;
        const existingLike = await prisma.like.findFirst({ where: { storyId, userId } });
        if (existingLike) {
            await prisma.like.delete({ where: { id: existingLike.id } });
            res.json({ message: 'Like retiré', isLiked: false });
        }
        else {
            await prisma.like.create({ data: { storyId, userId } });
            res.json({ message: 'Like ajouté', isLiked: true });
        }
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors du toggle du like');
    }
};
exports.toggleLike = toggleLike;
//======= GET POSTED LIKES (PRIVATE) =======
const getPostedLikes = async (req, res) => {
    try {
        const userId = req.user.userId;
        const stories = await prisma.story.findMany({
            where: {
                likes: {
                    some: {
                        userId: userId
                    }
                },
                status: 'PUBLISHED'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                },
                likes: {
                    where: {
                        userId: userId
                    },
                    select: {
                        createdAt: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });
        const likedStories = stories
            .map(story => ({
            storyId: story.id,
            title: story.title,
            publishDate: story.publishedAt.toISOString(),
            likedAt: story.likes[0].createdAt.toISOString(),
            user: {
                id: story.user.id,
                username: story.user.username,
                avatar: story.user.avatar || ''
            }
        }))
            .sort((a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime());
        res.json({ likedStories });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération des histoires likées');
    }
};
exports.getPostedLikes = getPostedLikes;
