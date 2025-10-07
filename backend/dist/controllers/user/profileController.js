"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const helpers_2 = require("@utils/chroniques/helpers");
const prisma = new client_1.PrismaClient();
//======= GET PROFILE =======
const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: helpers_2.userSelectFields
        });
        if (!user) {
            (0, helpers_1.sendNotFound)(res, 'Utilisateur non trouvé');
            return;
        }
        res.json({ user });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la récupération du profil');
    }
};
exports.getProfile = getProfile;
//======= UPDATE PROFILE =======
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { username, description, avatar, playerId, playerDays } = req.body;
        if (username && username.length < 3) {
            res.status(400).json({ error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' });
            return;
        }
        if (username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username: username,
                    NOT: { id: userId }
                }
            });
            if (existingUser) {
                res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
                return;
            }
        }
        const updateData = {};
        if (username !== undefined)
            updateData.username = username;
        if (description !== undefined)
            updateData.description = description;
        if (avatar !== undefined)
            updateData.avatar = avatar;
        if (playerId !== undefined)
            updateData.playerId = playerId;
        if (playerDays !== undefined)
            updateData.playerDays = playerDays;
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: helpers_2.userSelectFields
        });
        res.json({
            message: 'Profil mis à jour avec succès',
            user: updatedUser
        });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la mise à jour du profil');
    }
};
exports.updateProfile = updateProfile;
