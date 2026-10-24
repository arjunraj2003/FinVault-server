import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { NotificationController } from "../controller/Notification.controller";

const router = Router();

router.get("/vapid-public-key", NotificationController.publicKey);
router.post("/subscribe", authenticate, NotificationController.subscribe);
router.delete("/subscribe", authenticate, NotificationController.unsubscribe);

export default router;
