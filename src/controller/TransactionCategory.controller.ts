import { NextFunction, Request, Response } from "express";
import { TransactionCategoryService } from "../service/TransactionCategory.service";
import { ApiResponse } from "../utils/apiResponse";

export class TransactionCategoryController {  //  renamed — was conflicting with the entity name

    static async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, description } = req.body;

            // Validate name
            if (!name || typeof name !== "string" || !name.trim()) {
                return res.status(400).json(new ApiResponse(false, "name is required."));
            }

            const category = await TransactionCategoryService.createCategory(name.trim(), description?.trim());

            res.status(201).json(new ApiResponse(true, "Category created successfully", category)); // ✅ 201 not 200
        } catch (err) {
            next(err); // pass err — was next() which swallows the error
        }
    }

    static async getAllCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await TransactionCategoryService.getAllCategories();
            res.status(200).json(new ApiResponse(true, "Categories fetched successfully", categories));
        } catch (err) {
            next(err);
        }
    }

    static async getCategoryById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const category = await TransactionCategoryService.getCategoryById(id);
            res.status(200).json(new ApiResponse(true, "Category fetched successfully", category));
        } catch (err) {
            next(err);
        }
    }

    static async updateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const category = await TransactionCategoryService.updateCategory(id, name?.trim(), description?.trim());
            res.status(200).json(new ApiResponse(true, "Category updated successfully", category));
        } catch (err) {
            next(err);
        }
    }

    static async deactivateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await TransactionCategoryService.deactivateCategory(id);
            res.status(200).json(new ApiResponse(true, result.message));
        } catch (err) {
            next(err);
        }
    }
}