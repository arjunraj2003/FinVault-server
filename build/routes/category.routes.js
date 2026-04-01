"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const TransactionCategory_controller_1 = require("../controller/TransactionCategory.controller");
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.authenticate, TransactionCategory_controller_1.TransactionCategoryController.createCategory);
router.get("/", auth_middleware_1.authenticate, TransactionCategory_controller_1.TransactionCategoryController.getAllCategories);
router.get("/:id", auth_middleware_1.authenticate, TransactionCategory_controller_1.TransactionCategoryController.getCategoryById);
router.patch("/:id", auth_middleware_1.authenticate, TransactionCategory_controller_1.TransactionCategoryController.updateCategory);
router.delete("/:id", auth_middleware_1.authenticate, TransactionCategory_controller_1.TransactionCategoryController.deactivateCategory);
exports.default = router;
//# sourceMappingURL=category.routes.js.map