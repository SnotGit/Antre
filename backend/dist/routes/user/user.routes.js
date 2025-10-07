"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticateToken_1 = require("@middlewares/auth/authenticateToken");
const validateStoryId_1 = require("@middlewares/chroniques/validateStoryId");
const validateOwnership_1 = require("@middlewares/chroniques/validateOwnership");
const errorHandler_1 = require("@middlewares/chroniques/errorHandler");
const profileController_1 = require("@controllers/user/profileController");
const statsController_1 = require("@controllers/user/statsController");
const credentialsController_1 = require("@controllers/user/credentialsController");
const likeController_1 = require("@controllers/user/likeController");
const draftsStoriesController_1 = require("@controllers/chroniques/draftsStoriesController");
const publishedStoriesController_1 = require("@controllers/chroniques/publishedStoriesController");
const saveStoriesController_1 = require("@controllers/chroniques/saveStoriesController");
const deleteStoriesController_1 = require("@controllers/chroniques/deleteStoriesController");
const router = (0, express_1.Router)();
//======= PROTECTED ROUTES =======
router.use(authenticateToken_1.authenticateToken);
//======= PROFILE ROUTES =======
router.get('/profile', profileController_1.getProfile);
router.put('/profile', profileController_1.updateProfile);
//======= STATS ROUTES =======
router.get('/stats', statsController_1.getStats);
//======= CREDENTIALS ROUTES =======
router.put('/credentials/email', credentialsController_1.updateEmail);
router.put('/credentials/password', credentialsController_1.changePassword);
//======= LIKES ROUTES =======
router.get('/likes/story/:id/status', likeController_1.getStatus);
router.post('/likes/story/:id/toggle', likeController_1.toggleLike);
router.get('/likes/liked-stories', likeController_1.getPostedLikes);
//======= DRAFT ROUTES =======
router.get('/stories/drafts', draftsStoriesController_1.getDraftStories);
router.get('/stories/drafts/:id', validateStoryId_1.validateStoryId, draftsStoriesController_1.getDraftStory);
router.post('/stories/drafts', saveStoriesController_1.createDraft);
router.put('/stories/drafts/:id', validateStoryId_1.validateStoryId, saveStoriesController_1.saveDraft);
router.post('/stories/drafts/:id/publish', validateStoryId_1.validateStoryId, saveStoriesController_1.publishStory);
//======= PUBLISHED ROUTES =======
router.get('/stories/published', publishedStoriesController_1.getPublishedStories);
router.get('/stories/published/:id', validateStoryId_1.validateStoryId, publishedStoriesController_1.getPublishedStory);
router.put('/stories/published/:id', validateStoryId_1.validateStoryId, saveStoriesController_1.updateStory);
//======= DELETE ROUTES =======
router.delete('/stories/:id', validateStoryId_1.validateStoryId, validateOwnership_1.validateOwnership, deleteStoriesController_1.deleteStory);
router.post('/stories/delete', deleteStoriesController_1.deleteStories);
//======= ERROR HANDLER =======
router.use(errorHandler_1.errorHandler);
exports.default = router;
