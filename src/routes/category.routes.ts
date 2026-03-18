import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { TransactionCategoryController } from "../controller/TransactionCategory.controller";

const router = Router();

router.post("/", authenticate, TransactionCategoryController.createCategory);
router.get("/", authenticate, TransactionCategoryController.getAllCategories);
router.get("/:id", authenticate, TransactionCategoryController.getCategoryById);  
router.patch("/:id", authenticate, TransactionCategoryController.updateCategory);    
router.delete("/:id", authenticate, TransactionCategoryController.deactivateCategory); 

export default router;