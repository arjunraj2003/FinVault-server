import { Router } from "express";
import { AccountController } from "../controller/Account.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router=Router()

router.post('/create',authenticate,AccountController.createAccount)
router.get('/getBalance/:accountId',authenticate,AccountController.getBalance)
router.get('/getAccounts',authenticate,AccountController.getAllAccounts)

export default router