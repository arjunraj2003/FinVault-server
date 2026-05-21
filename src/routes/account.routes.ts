import { Router } from "express";
import { AccountController } from "../controller/Account.controller";
import { CreditCardController } from "../controller/CreditCard.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router=Router()

router.post('/create',authenticate,AccountController.createAccount)
router.get('/getBalance/:accountId',authenticate,AccountController.getBalance)
router.get('/getAccounts',authenticate,AccountController.getAllAccounts)
router.get('/:accountId/credit-card-summary', authenticate, CreditCardController.getSummary)

export default router