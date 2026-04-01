"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionCategoryController = void 0;
const TransactionCategory_service_1 = require("../service/TransactionCategory.service");
const apiResponse_1 = require("../utils/apiResponse");
class TransactionCategoryController {
    static async createCategory(req, res, next) {
        try {
            const { name, description } = req.body;
            // Validate name
            if (!name || typeof name !== "string" || !name.trim()) {
                return res.status(400).json(new apiResponse_1.ApiResponse(false, "name is required."));
            }
            const category = await TransactionCategory_service_1.TransactionCategoryService.createCategory(name.trim(), description?.trim());
            res.status(201).json(new apiResponse_1.ApiResponse(true, "Category created successfully", category)); // ✅ 201 not 200
        }
        catch (err) {
            next(err); // pass err — was next() which swallows the error
        }
    }
    static async getAllCategories(req, res, next) {
        try {
            const categories = await TransactionCategory_service_1.TransactionCategoryService.getAllCategories();
            res.status(200).json(new apiResponse_1.ApiResponse(true, "Categories fetched successfully", categories));
        }
        catch (err) {
            next(err);
        }
    }
    static async getCategoryById(req, res, next) {
        try {
            const { id } = req.params;
            const category = await TransactionCategory_service_1.TransactionCategoryService.getCategoryById(id);
            res.status(200).json(new apiResponse_1.ApiResponse(true, "Category fetched successfully", category));
        }
        catch (err) {
            next(err);
        }
    }
    static async updateCategory(req, res, next) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            const category = await TransactionCategory_service_1.TransactionCategoryService.updateCategory(id, name?.trim(), description?.trim());
            res.status(200).json(new apiResponse_1.ApiResponse(true, "Category updated successfully", category));
        }
        catch (err) {
            next(err);
        }
    }
    static async deactivateCategory(req, res, next) {
        try {
            const { id } = req.params;
            const result = await TransactionCategory_service_1.TransactionCategoryService.deactivateCategory(id);
            res.status(200).json(new apiResponse_1.ApiResponse(true, result.message));
        }
        catch (err) {
            next(err);
        }
    }
}
exports.TransactionCategoryController = TransactionCategoryController;
//# sourceMappingURL=TransactionCategory.controller.js.map