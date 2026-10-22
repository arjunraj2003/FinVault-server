import { NextFunction, Request, Response } from "express";
import { TransactionCategoryService } from "../service/TransactionCategory.service";
import { ApiResponse } from "../utils/apiResponse";
import { getAuthUserId } from "../middlewares/auth.middleware";

export class TransactionCategoryController {

    static async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, description } = req.body;
            const userId = getAuthUserId(req);

            if (!name || typeof name !== "string" || !name.trim()) {
                return res.status(400).json(new ApiResponse(false, "name is required."));
            }

            const category = await TransactionCategoryService.createCategory(userId, name.trim(), description?.trim());

            res.status(201).json(new ApiResponse(true, "Category created successfully", category));
        } catch (err) {
            next(err);
        }
    }

    static async getAllCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await TransactionCategoryService.getAllCategories(getAuthUserId(req));
            res.status(200).json(new ApiResponse(true, "Categories fetched successfully", categories));
        } catch (err) {
            next(err);
        }
    }

    static async getCategoryById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const category = await TransactionCategoryService.getCategoryById(id, getAuthUserId(req));
            res.status(200).json(new ApiResponse(true, "Category fetched successfully", category));
        } catch (err) {
            next(err);
        }
    }

    static async updateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const category = await TransactionCategoryService.updateCategory(
                id,
                getAuthUserId(req),
                name?.trim(),
                description?.trim()
            );
            res.status(200).json(new ApiResponse(true, "Category updated successfully", category));
        } catch (err) {
            next(err);
        }
    }

    static async deactivateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await TransactionCategoryService.deactivateCategory(id, getAuthUserId(req));
            res.status(200).json(new ApiResponse(true, result.message));
        } catch (err) {
            next(err);
        }
    }
}
