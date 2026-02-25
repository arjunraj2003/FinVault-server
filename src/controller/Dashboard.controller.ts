import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../service/Dashboard.service";
import { ApiResponse } from "../utils/apiResponse";

export class DashboardController {

  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountId, year } = req.query;

      if (!accountId || !year) {
        throw new Error("accountId and year are required");
      }

      const data = await DashboardService.getDashboardSummary(
        accountId as string,
        Number(year)
      );

      res.status(200).json(
        new ApiResponse(true, "Dashboard fetched successfully", data)
      );
    } catch (error) {
      next(error);
    }
  }
}