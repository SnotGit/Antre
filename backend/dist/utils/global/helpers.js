"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBadRequest = exports.sendNotFound = exports.sendSuccess = exports.sendError = exports.handleError = exports.parseStoryId = void 0;
//======= ID PARSING =======
const parseStoryId = (id) => {
    const storyId = parseInt(id, 10);
    return isNaN(storyId) || storyId <= 0 ? null : storyId;
};
exports.parseStoryId = parseStoryId;
//======= ERROR HANDLING =======
const handleError = (res, message = 'Erreur serveur') => {
    console.error(message);
    const errorResponse = { error: message };
    res.status(500).json(errorResponse);
};
exports.handleError = handleError;
//======= RESPONSE HELPERS =======
const sendError = (res, message, statusCode) => {
    const errorResponse = { error: message };
    res.status(statusCode).json(errorResponse);
};
exports.sendError = sendError;
const sendSuccess = (res, message, statusCode = 200) => {
    const successResponse = { message };
    res.status(statusCode).json(successResponse);
};
exports.sendSuccess = sendSuccess;
const sendNotFound = (res, message) => {
    (0, exports.sendError)(res, message, 404);
};
exports.sendNotFound = sendNotFound;
const sendBadRequest = (res, message) => {
    (0, exports.sendError)(res, message, 400);
};
exports.sendBadRequest = sendBadRequest;
