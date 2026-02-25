"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const Transaction_controller_1 = require("../controller/Transaction.controller");
const router = (0, express_1.Router)();
router.post('/create', auth_middleware_1.authenticate, Transaction_controller_1.TransactionController.createTransaction);
router.get('/getAll', Transaction_controller_1.TransactionController.getTransactions);
router.delete('/delete/:transactionId', Transaction_controller_1.TransactionController.deleteTransaction);
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map