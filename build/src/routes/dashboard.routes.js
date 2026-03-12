"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Dashboard_controller_1 = require("../controller/Dashboard.controller");
const router = (0, express_1.Router)();
router.get("/summary", Dashboard_controller_1.DashboardController.getDashboard);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map