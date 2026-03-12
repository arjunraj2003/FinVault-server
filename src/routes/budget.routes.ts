import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/body.validator.middleware";
import { BudgetController } from "../controller/Budget.controller";
import { createBudgetSchema, updateBudgetSchema } from "../utils/validators/budgetValidator";

const router = Router();

router.use(authenticate);

router.post("/", validateBody(createBudgetSchema), BudgetController.createBudget);
router.get("/", BudgetController.getBudgets);
router.get("/progress/:id", BudgetController.getBudgetProgress);
router.get("/:id", BudgetController.getBudgetById);
router.put("/:id", validateBody(updateBudgetSchema), BudgetController.updateBudget);
router.delete("/:id", BudgetController.deleteBudget);

export default router;
