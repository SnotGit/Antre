"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStoryId = void 0;
const helpers_1 = require("@utils/global/helpers");
const validateStoryId = (req, res, next) => {
    const storyId = (0, helpers_1.parseStoryId)(req.params.id);
    if (storyId === null) {
        (0, helpers_1.sendBadRequest)(res, 'ID invalide');
        return;
    }
    req.storyId = storyId;
    next();
};
exports.validateStoryId = validateStoryId;
