"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
//======= GET STATS =======
const getStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [draftsCount, publishedCount, totalLikes] = await Promise.all([
            prisma.story.count({
                where: {
                    userId: userId,
                    status: 'DRAFT'
                }
            }),
            prisma.story.count({
                where: {
                    userId: userId,
                    status: 'PUBLISHED'
                }
            }),
            prisma.like.count({
                where: {
                    story: {
                        userId: userId,
                        status: 'PUBLISHED'
                    }
                }
            })
        ]);
        const stats = {
            drafts: draftsCount,
            published: publishedCount,
            totalStories: draftsCount + publishedCount,
            totalLikes: totalLikes
        };
        res.json({ stats });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération des statistiques');
    }
};
exports.getStats = getStats;
