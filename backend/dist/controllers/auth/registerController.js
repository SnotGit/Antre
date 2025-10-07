"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const helpers_1 = require("@utils/global/helpers");
const helpers_2 = require("@utils/chroniques/helpers");
const prisma = new client_1.PrismaClient();
const jwtConfig_1 = require("./jwtConfig");
//======= REGISTER =======
const register = async (req, res) => {
    try {
        const { username, email, password, description } = req.body;
        if (!username || !email || !password) {
            (0, helpers_1.sendError)(res, 'Nom d\'utilisateur, email et mot de passe sont requis', 400);
            return;
        }
        if (username.length < 3) {
            (0, helpers_1.sendError)(res, 'Le nom d\'utilisateur doit contenir au moins 3 caractères', 400);
            return;
        }
        if (password.length < 8) {
            (0, helpers_1.sendError)(res, 'Le mot de passe doit contenir au moins 8 caractères', 400);
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            (0, helpers_1.sendError)(res, 'Format d\'email invalide', 400);
            return;
        }
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: username }
                ]
            }
        });
        if (existingUser) {
            if (existingUser.email === email) {
                (0, helpers_1.sendError)(res, 'Cet email est déjà utilisé', 409);
                return;
            }
            if (existingUser.username === username) {
                (0, helpers_1.sendError)(res, 'Ce nom d\'utilisateur est déjà pris', 409);
                return;
            }
        }
        const saltRounds = 10;
        const passwordHash = await bcryptjs_1.default.hash(password, saltRounds);
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                description: description || ''
            },
            select: helpers_2.userSelectFields
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, (0, jwtConfig_1.getJwtSecret)(), { expiresIn: '24h' });
        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            token: token,
            user: user
        });
    }
    catch (error) {
        (0, helpers_1.handleError)(res, 'Erreur lors de l\'inscription');
    }
};
exports.register = register;
