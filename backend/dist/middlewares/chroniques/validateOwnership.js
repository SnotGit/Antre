"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOwnership = void 0;
const helpers_1 = require("@utils/chroniques/helpers");
const helpers_2 = require("@utils/global/helpers");
const validateOwnership = async (req, res, next) => {
    try {
        const storyId = req.storyId;
        const userId = req.user.userId;
        const story = await (0, helpers_1.getStoryWithOwnership)(storyId, userId);
        if (!story) {
            (0, helpers_2.sendNotFound)(res, 'Histoire non trouvée');
            return;
        }
        req.story = story;
        next();
    }
    catch (error) {
        console.error('Erreur lors de la validation ownership:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
exports.validateOwnership = validateOwnership;
