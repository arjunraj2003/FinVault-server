"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const Dashboard_service_1 = require("../service/Dashboard.service");
const apiResponse_1 = require("../utils/apiResponse");
class DashboardController {
    static async getDashboard(req, res, next) {
        try {
            const { accountId, year, month } = req.query;
            if (!accountId || !year) {
                throw new Error("accountId and year are required");
            }
            console.log(month);
            const data = await Dashboard_service_1.DashboardService.getDashboardSummary(accountId, Number(year), Number(month));
            res.status(200).json(new apiResponse_1.ApiResponse(true, "Dashboard fetched successfully", data));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=Dashboard.controller.js.map