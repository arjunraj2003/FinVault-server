import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/body.validator.middleware";
import { BudgetController } from "../controller/Budget.controller";
import { createBudgetSchema, updateBudgetSchema } from "../utils/validators/budgetValidator";

const router = Router();

router.use(authenticate);

router.post("/", authenticate,validateBody(createBudgetSchema), BudgetController.createBudget);
router.get("/", authenticate,BudgetController.getBudgets);
router.get("/progress/:id",authenticate, BudgetController.getBudgetProgress);
router.get("/:id",authenticate, BudgetController.getBudgetById);
router.put("/:id", authenticate,validateBody(updateBudgetSchema), BudgetController.updateBudget);
router.delete("/:id",authenticate, BudgetController.deleteBudget);

export default router;
