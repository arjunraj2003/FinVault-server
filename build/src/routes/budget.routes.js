"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const body_validator_middleware_1 = require("../middlewares/body.validator.middleware");
const Budget_controller_1 = require("../controller/Budget.controller");
const budgetValidator_1 = require("../utils/validators/budgetValidator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, body_validator_middleware_1.validateBody)(budgetValidator_1.createBudgetSchema), Budget_controller_1.BudgetController.createBudget);
router.get("/", Budget_controller_1.BudgetController.getBudgets);
router.get("/progress/:id", Budget_controller_1.BudgetController.getBudgetProgress);
router.get("/:id", Budget_controller_1.BudgetController.getBudgetById);
router.put("/:id", (0, body_validator_middleware_1.validateBody)(budgetValidator_1.updateBudgetSchema), Budget_controller_1.BudgetController.updateBudget);
router.delete("/:id", Budget_controller_1.BudgetController.deleteBudget);
exports.default = router;
//# sourceMappingURL=budget.routes.js.map