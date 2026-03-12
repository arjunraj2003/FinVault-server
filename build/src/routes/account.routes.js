"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Account_controller_1 = require("../controller/Account.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/create', auth_middleware_1.authenticate, Account_controller_1.AccountController.createAccount);
router.get('/getBalance/:accountId', auth_middleware_1.authenticate, Account_controller_1.AccountController.getBalance);
router.get('/getAccounts', auth_middleware_1.authenticate, Account_controller_1.AccountController.getAllAccounts);
exports.default = router;
//# sourceMappingURL=account.routes.js.map