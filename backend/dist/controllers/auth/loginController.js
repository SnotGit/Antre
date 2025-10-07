"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const helpers_1 = require("@utils/global/helpers");
const prisma = new client_1.PrismaClient();
const jwtConfig_1 = require("./jwtConfig");
//======= LOGIN =======
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            (0, helpers_1.sendError)(res, 'Email et mot de passe sont requis', 400);
            return;
        }
        const user = await prisma.user.findUnique({
            where: { email: email },
            select: {
                id: true,
                username: true,
                email: true,
                passwordHash: true,
                description: true,
                avatar: true,
                role: true,
                playerId: true,
                playerDays: true,
                createdAt: true
            }
        });
        if (!user) {
            (0, helpers_1.sendError)(res, 'Email ou mot de passe incorrect', 401);
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            (0, helpers_1.sendError)(res, 'Email ou mot de passe incorrect', 401);
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, (0, jwtConfig_1.getJwtSecret)(), { expiresIn: '24h' });
        const { passwordHash, ...userData } = user;
        res.json({
            message: 'Connexion réussie',
            token: token,
            user: userData
        });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de la connexion');
    }
};
exports.login = login;
