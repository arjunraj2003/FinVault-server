import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { TransactionController } from "../controller/Transaction.controller";

const router=Router();

router.post('/create',authenticate,TransactionController.createTransaction)
router.get('/getAll',TransactionController.getTransactions)
router.delete('/delete/:transactionId',TransactionController.deleteTransaction)

export default router;
