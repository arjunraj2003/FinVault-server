"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("./chat.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
// import { authMiddleware } from "../middleware/auth";
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.authenticate, chat_controller_1.ChatController.chat);
exports.default = router;
//# sourceMappingURL=chat.router.js.map