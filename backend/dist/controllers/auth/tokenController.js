"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToken = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("@utils/global/helpers");
const helpers_2 = require("@utils/chroniques/helpers");
const prisma = new client_1.PrismaClient();
//======= VALIDATE TOKEN =======
const validateToken = async (req, res) => {
    try {
        const authenticatedReq = req;
        const userId = authenticatedReq.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: helpers_2.userSelectFields
        });
        if (!user) {
            (0, helpers_1.sendNotFound)(res, 'Utilisateur non trouvé');
            return;
        }
        res.json({
            message: 'Token valide',
            user
        });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la validation du token');
    }
};
exports.validateToken = validateToken;
