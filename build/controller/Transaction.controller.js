"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const Transaction_service_1 = require("../service/Transaction.service");
const apiResponse_1 = require("../utils/apiResponse");
const Transaction_entity_1 = require("../entity/Transaction.entity");
class TransactionController {
    static async createTransaction(req, res, next) {
        try {
            const { type, amount, accountId, category, description, transactionDate } = req.body;
            const amt = Number(amount);
            if (!amt || isNaN(amt) || amt <= 0) {
                throw new Error("Invalid amount. Must be greater than 0.");
            }
            if (!Object.values(Transaction_entity_1.TransactionType).includes(type)) {
                throw new Error("Invalid transaction type.");
            }
            if (!Object.values(Transaction_entity_1.TransactionCategory).includes(category)) {
                throw new Error("Invalid transaction category.");
            }
            if (!transactionDate) {
                throw new Error("Transaction date is required.");
            }
            const result = await Transaction_service_1.TransactionService.createTransaction(type, amt, accountId, category, description, new Date(transactionDate));
            res
                .status(201)
                .json(new apiResponse_1.ApiResponse(true, "Transaction created successfully", result));
        }
        catch (error) {
            next(error);
        }
    }
    static async getTransactions(req, res, next) {
        try {
            const result = await Transaction_service_1.TransactionService.getTransactions(req.query);
            res
                .status(200)
                .json(new apiResponse_1.ApiResponse(true, "Transactions fetched successfully", result));
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteTransaction(req, res, next) {
        try {
            const { transactionId } = req.params;
            const result = await Transaction_service_1.TransactionService.deleteTransaction(transactionId);
            res.status(200).json(new apiResponse_1.ApiResponse(true, result.message));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=Transaction.controller.js.map