"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_controller_1 = require("../controller/Auth.controller");
const router = (0, express_1.Router)();
router.post("/register", Auth_controller_1.AuthController.register);
router.post("/login", Auth_controller_1.AuthController.login);
router.post("/logout", Auth_controller_1.AuthController.logout);
router.post("/refresh", Auth_controller_1.AuthController.refresh);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map