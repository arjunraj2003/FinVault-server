import { Router } from "express";
import { ChatController } from "./chat.controller";
import { authenticate } from "../middlewares/auth.middleware";
// import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, ChatController.chat);

export default router;