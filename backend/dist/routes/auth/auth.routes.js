"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticateToken_1 = require("@middlewares/auth/authenticateToken");
const loginController_1 = require("@controllers/auth/loginController");
const registerController_1 = require("@controllers/auth/registerController");
const tokenController_1 = require("@controllers/auth/tokenController");
const router = (0, express_1.Router)();
//======= PUBLIC ROUTES =======
router.post('/login', loginController_1.login);
router.post('/register', registerController_1.register);
//======= PROTECTED ROUTES =======
router.get('/validate', authenticateToken_1.authenticateToken, tokenController_1.validateToken);
exports.default = router;
