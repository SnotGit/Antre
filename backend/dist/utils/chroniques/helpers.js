"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoryWithOwnership = exports.getUserStory = exports.userSelectFields = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
//======= USER SELECTION =======
exports.userSelectFields = {
    id: true,
    username: true,
    email: true,
    description: true,
    avatar: true,
    role: true,
    playerId: true,
    playerDays: true,
    createdAt: true
};
//======= STORY RETRIEVAL =======
const getUserStory = async (storyId, userId, status) => {
    return await prisma.story.findFirst({
        where: {
            id: storyId,
            userId: userId,
            status: status
        },
        select: {
            id: true,
            title: true,
            content: true
        }
    });
};
exports.getUserStory = getUserStory;
const getStoryWithOwnership = async (storyId, userId) => {
    return await prisma.story.findFirst({
        where: {
            id: storyId,
            userId: userId
        },
        select: {
            id: true,
            title: true,
            content: true,
            userId: true
        }
    });
};
exports.getStoryWithOwnership = getStoryWithOwnership;
