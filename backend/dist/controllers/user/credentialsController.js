"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateEmail = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
//======= UPDATE EMAIL =======
const updateEmail = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { newEmail } = req.body;
        if (!newEmail) {
            (0, helpers_1.sendError)(res, 'Nouvel email requis', 400);
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            (0, helpers_1.sendError)(res, 'Format d\'email invalide', 400);
            return;
        }
        const existingUser = await prisma.user.findFirst({
            where: {
                email: newEmail,
                NOT: { id: userId }
            }
        });
        if (existingUser) {
            (0, helpers_1.sendError)(res, 'Cet email est déjà utilisé', 409);
            return;
        }
        await prisma.user.update({
            where: { id: userId },
            data: { email: newEmail }
        });
        (0, helpers_1.sendSuccess)(res, 'Email mis à jour avec succès');
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la mise à jour de l\'email');
    }
};
exports.updateEmail = updateEmail;
//======= CHANGE PASSWORD =======
const changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            (0, helpers_1.sendError)(res, 'Mot de passe actuel et nouveau mot de passe requis', 400);
            return;
        }
        if (newPassword.length < 8) {
            (0, helpers_1.sendError)(res, 'Le nouveau mot de passe doit contenir au moins 8 caractères', 400);
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true }
        });
        if (!user) {
            (0, helpers_1.sendError)(res, 'Utilisateur non trouvé', 404);
            return;
        }
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            (0, helpers_1.sendError)(res, 'Mot de passe actuel incorrect', 401);
            return;
        }
        const saltRounds = 10;
        const newPasswordHash = await bcryptjs_1.default.hash(newPassword, saltRounds);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash }
        });
        (0, helpers_1.sendSuccess)(res, 'Mot de passe modifié avec succès');
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la modification du mot de passe');
    }
};
exports.changePassword = changePassword;
