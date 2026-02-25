import { Router } from "express";
import { DashboardController } from "../controller/Dashboard.controller";

const router = Router();

router.get("/summary", DashboardController.getDashboard);

export default router;