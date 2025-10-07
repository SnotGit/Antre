"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (error, req, res, next) => {
    console.error('Erreur middleware:', error);
    if (res.headersSent) {
        return next(error);
    }
    const errorResponse = {
        error: error.message || 'Erreur serveur'
    };
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
