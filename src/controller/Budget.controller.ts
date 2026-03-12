import { Request, Response, NextFunction } from "express";
import { BudgetService } from "../service/Budget.service";
import { ApiResponse } from "../utils/apiResponse";

const budgetService = new BudgetService();

export class BudgetController {
    static async createBudget(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const newBudget = await budgetService.createBudget({
                userId,
                ...req.body
            });
            res.status(201).json(new ApiResponse(true, "Budget created successfully", newBudget));
        } catch (error) {
            next(error);
        }
    }

    static async getBudgets(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const budgets = await budgetService.getBudgets(userId);
            res.status(200).json(new ApiResponse(true, "Budgets fetched successfully", budgets));
        } catch (error) {
            next(error);
        }
    }

    static async getBudgetById(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;
            const budget = await budgetService.getBudgetById(id, userId);

            if (!budget) {
                return res.status(404).json(new ApiResponse(false, "Budget not found"));
            }

            res.status(200).json(new ApiResponse(true, "Budget fetched successfully", budget));
        } catch (error) {
            next(error);
        }
    }

    static async updateBudget(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const updatedBudget = await budgetService.updateBudget(id, userId, req.body);
            res.status(200).json(new ApiResponse(true, "Budget updated successfully", updatedBudget));
        } catch (error) {
            next(error);
        }
    }

    static async deleteBudget(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            await budgetService.deleteBudget(id, userId);
            res.status(200).json(new ApiResponse(true, "Budget deleted successfully"));
        } catch (error) {
            next(error);
        }
    }

    static async getBudgetProgress(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const progress = await budgetService.getBudgetProgress(id, userId);
            res.status(200).json(new ApiResponse(true, "Budget progress fetched successfully", progress));
        } catch (error) {
            next(error);
        }
    }
}
