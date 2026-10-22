import { Router } from "express";
import { AuthController } from "../controller/Auth.controller";
import { WebAuthnController } from "../controller/WebAuthn.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router=Router()

router.post("/register",AuthController.register)
router.post("/login",AuthController.login)
router.post("/logout",AuthController.logout)
router.post("/refresh",AuthController.refresh)
router.post("/webauthn/register/options", authenticate, WebAuthnController.registerOptions)
router.post("/webauthn/register/verify", authenticate, WebAuthnController.registerVerify)
router.post("/webauthn/login/options", WebAuthnController.loginOptions)
router.post("/webauthn/login/verify", WebAuthnController.loginVerify)
router.delete("/webauthn", authenticate, WebAuthnController.remove)

export default router