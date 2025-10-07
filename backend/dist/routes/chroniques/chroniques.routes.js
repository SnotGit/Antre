"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const publicStoriesController_1 = require("@controllers/chroniques/publicStoriesController");
const likeController_1 = require("@controllers/user/likeController");
const router = (0, express_1.Router)();
//======= PUBLIC ROUTES =======
router.get('/stories/latest', publicStoriesController_1.getLatestStories);
router.get('/stories', publicStoriesController_1.getUserStories);
router.get('/stories/:id', publicStoriesController_1.getUserStory);
router.get('/likes/story/:id/count', likeController_1.getCount);
exports.default = router;
