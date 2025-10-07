"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const helpers_1 = require("@utils/global/helpers");
const jwtConfig_1 = require("@controllers/auth/jwtConfig");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        (0, helpers_1.sendError)(res, 'Token manquant', 401);
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, (0, jwtConfig_1.getJwtSecret)());
        req.user = { userId: decoded.userId };
        next();
    }
    catch (error) {
        (0, helpers_1.sendError)(res, 'Token invalide', 403);
    }
};
exports.authenticateToken = authenticateToken;
