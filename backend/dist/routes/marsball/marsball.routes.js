"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticateToken_1 = require("@middlewares/auth/authenticateToken");
const uploadMarsball_1 = require("@middlewares/marsball/uploadMarsball");
const marsballController_1 = require("@controllers/marsball/marsballController");
const router = (0, express_1.Router)();
//======= PUBLIC ROUTES =======
router.get('/categories', marsballController_1.getCategories);
router.get('/categories/:id', marsballController_1.getCategoryWithLists);
router.get('/lists/:id', marsballController_1.getListWithItems);
router.get('/items/:id', marsballController_1.getItemDetail);
//======= PROTECTED ADMIN ROUTES =======
router.use(authenticateToken_1.authenticateToken);
router.post('/categories', marsballController_1.createCategory);
router.post('/lists', marsballController_1.createList);
router.post('/items', uploadMarsball_1.uploadMarsball.fields([{ name: 'image', maxCount: 1 }]), uploadMarsball_1.processImage, marsballController_1.createItem);
exports.default = router;
