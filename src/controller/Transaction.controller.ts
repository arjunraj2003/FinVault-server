import { NextFunction, Request, Response } from "express";
import { TransactionService } from "../service/Transaction.service";
import { ApiResponse } from "../utils/apiResponse";
import { TransactionType, TransactionCategory } from "../entity/Transaction.entity";

export class TransactionController {
    static async createTransaction(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { type, amount, accountId, category, description, transactionDate } = req.body;

            const amt = Number(amount);

            if (!amt || isNaN(amt) || amt <= 0) {
                throw new Error("Invalid amount. Must be greater than 0.");
            }

            if (!Object.values(TransactionType).includes(type)) {
                throw new Error("Invalid transaction type.");
            }

            if (!Object.values(TransactionCategory).includes(category)) {
                throw new Error("Invalid transaction category.");
            }

            if (!transactionDate) {
                throw new Error("Transaction date is required.");
            }

            const result = await TransactionService.createTransaction(
                type,
                amt,
                accountId,
                category,
                description,
                new Date(transactionDate)
            );

            res
                .status(201)
                .json(new ApiResponse(true, "Transaction created successfully", result));
        } catch (error) {
            next(error);
        }
    }

    static async getTransactions(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const result = await TransactionService.getTransactions(req.query);

            res
                .status(200)
                .json(new ApiResponse(true, "Transactions fetched successfully", result));
        } catch (error) {
            next(error);
        }
    }

    static async deleteTransaction(req: Request, res: Response, next: NextFunction) {
        try {
            const { transactionId } = req.params;

            const result = await TransactionService.deleteTransaction(transactionId);

            res.status(200).json(new ApiResponse(true, result.message));
        } catch (error) {
            next(error);
        }
    }
}