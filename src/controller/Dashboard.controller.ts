import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../service/Dashboard.service";
import { ApiResponse } from "../utils/apiResponse";
import { getAuthUserId } from "../middlewares/auth.middleware";

export class DashboardController {

  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountId, year,month } = req.query;

      if (!accountId || !year) {
        throw new Error("accountId and year are required");
      }
      
      console.log(month)
      const data = await DashboardService.getDashboardSummary(
        accountId as string,
        Number(year),
        Number(month),
        getAuthUserId(req)
      );

      res.status(200).json(
        new ApiResponse(true, "Dashboard fetched successfully", data)
      );
    } catch (error) {
      next(error);
    }
  }
}