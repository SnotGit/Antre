"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticateToken_1 = require("@middlewares/auth/authenticateToken");
const uploadImage_1 = require("@middlewares/marsball/uploadImage");
const getController_1 = require("@controllers/marsball/getController");
const createController_1 = require("@controllers/marsball/createController");
const updateController_1 = require("@controllers/marsball/updateController");
const deleteController_1 = require("@controllers/marsball/deleteController");
const router = (0, express_1.Router)();
//======= PUBLIC ROUTES =======
router.get('/categories', getController_1.getRootCategories);
router.get('/categories/:id', getController_1.getCategoryWithChildren);
//======= ADMIN ROUTES =======
router.use(authenticateToken_1.authenticateToken);
router.post('/categories', createController_1.createCategory);
router.put('/categories/:id', updateController_1.updateCategory);
router.delete('/categories/:id', deleteController_1.deleteCategory);
router.post('/categories/batch-delete', deleteController_1.batchDeleteCategories);
router.post('/items', uploadImage_1.uploadImage.single('image'), createController_1.createItem);
router.put('/items/:id', updateController_1.updateItem);
router.delete('/items/:id', deleteController_1.deleteItem);
router.post('/items/batch-delete', deleteController_1.batchDeleteItems);
exports.default = router;
