"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetController = void 0;
const Budget_service_1 = require("../service/Budget.service");
const apiResponse_1 = require("../utils/apiResponse");
const budgetService = new Budget_service_1.BudgetService();
class BudgetController {
    static async createBudget(req, res, next) {
        try {
            const userId = req.user.id;
            const newBudget = await budgetService.createBudget({
                userId,
                ...req.body
            });
            res.status(201).json(new apiResponse_1.ApiResponse(true, "Budget created successfully", newBudget));
        }
        catch (error) {
            next(error);
        }
    }
    static async getBudgets(req, res, next) {
        try {
            const userId = req.user.id;
            const budgets = await budgetService.getBudgets(userId);
            res.status(200).json(new apiResponse_1.ApiResponse(true, "Budgets fetched successfully", budgets));
        }
        catch (error) {
            next(error);
        }
    }
    static async getBudgetById(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const budget = await budgetService.getBudgetById(id, userId);
            if (!budget) {
                return res.status(404).json(new apiResponse_1.ApiResponse(false, "Budget not found"));
            }
            res.status(200).json(new apiResponse_1.ApiResponse(true, "Budget fetched successfully", budget));
        }
        catch (error) {
            next(error);
        }
    }
    static async updateBudget(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const updatedBudget = await budgetService.updateBudget(id, userId, req.body);
            res.status(200).json(new apiResponse_1.ApiResponse(true, "Budget updated successfully", updatedBudget));
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteBudget(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await budgetService.deleteBudget(id, userId);
            res.status(200).json(new apiResponse_1.ApiResponse(true, "Budget deleted successfully"));
        }
        catch (error) {
            next(error);
        }
    }
    static async getBudgetProgress(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const progress = await budgetService.getBudgetProgress(id, userId);
            res.status(200).json(new apiResponse_1.ApiResponse(true, "Budget progress fetched successfully", progress));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BudgetController = BudgetController;
//# sourceMappingURL=Budget.controller.js.map