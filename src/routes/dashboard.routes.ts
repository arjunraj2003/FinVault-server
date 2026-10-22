import { Router } from "express";
import { DashboardController } from "../controller/Dashboard.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/summary", authenticate, DashboardController.getDashboard);

export default router;