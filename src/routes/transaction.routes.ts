import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { TransactionController } from "../controller/Transaction.controller";

const router=Router();

router.post('/create',authenticate,TransactionController.createTransaction)
router.get('/getAll',authenticate,TransactionController.getTransactions)
router.delete('/delete/:transactionId',authenticate,TransactionController.deleteTransaction)

export default router;
