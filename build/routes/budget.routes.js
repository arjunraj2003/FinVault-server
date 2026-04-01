"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const body_validator_middleware_1 = require("../middlewares/body.validator.middleware");
const Budget_controller_1 = require("../controller/Budget.controller");
const budgetValidator_1 = require("../utils/validators/budgetValidator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", auth_middleware_1.authenticate, (0, body_validator_middleware_1.validateBody)(budgetValidator_1.createBudgetSchema), Budget_controller_1.BudgetController.createBudget);
router.get("/", auth_middleware_1.authenticate, Budget_controller_1.BudgetController.getBudgets);
router.get("/progress/:id", auth_middleware_1.authenticate, Budget_controller_1.BudgetController.getBudgetProgress);
router.get("/:id", auth_middleware_1.authenticate, Budget_controller_1.BudgetController.getBudgetById);
router.put("/:id", auth_middleware_1.authenticate, (0, body_validator_middleware_1.validateBody)(budgetValidator_1.updateBudgetSchema), Budget_controller_1.BudgetController.updateBudget);
router.delete("/:id", auth_middleware_1.authenticate, Budget_controller_1.BudgetController.deleteBudget);
exports.default = router;
//# sourceMappingURL=budget.routes.js.map