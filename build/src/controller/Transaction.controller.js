"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const Transaction_service_1 = require("../service/Transaction.service");
const apiResponse_1 = require("../utils/apiResponse");
const transaction_category_enum_1 = require("../utils/transaction-category.enum");
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Sends a 400 Bad Request response and returns true so the caller can bail out.
 * Using res.status(400).json() instead of throw new Error() ensures validation
 * failures are returned as 400s — not 500s — without relying on the error
 * middleware knowing the difference.
 */
function badRequest(res, message) {
    res.status(400).json(new apiResponse_1.ApiResponse(false, message));
    return true;
}
/**
 * Parses a query string value that must be a positive integer within [min, max].
 * Returns the parsed number, or null if invalid.
 */
function parsePositiveInt(value, min, max) {
    if (value === undefined)
        return null;
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > max)
        return null;
    return n;
}
// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------
class TransactionController {
    static async createTransaction(req, res, next) {
        try {
            const { type, amount, accountId, category, description, transactionDate, } = req.body;
            // --- accountId ---
            // Missing entirely in original code — undefined was silently forwarded
            // to the service which then threw a generic 500.
            if (!accountId || typeof accountId !== "string" || !accountId.trim()) {
                if (badRequest(res, "accountId is required."))
                    return;
            }
            // --- amount ---
            // Convert here once; never re-convert downstream.
            // Check isFinite so that "Infinity" / "NaN" strings are rejected.
            const amt = Number(amount);
            if (!amount || !Number.isFinite(amt) || amt <= 0) {
                if (badRequest(res, "amount must be a finite number greater than 0."))
                    return;
            }
            // --- type ---
            if (!type || !Object.values(transaction_category_enum_1.TransactionType).includes(type)) {
                if (badRequest(res, `type must be one of: ${Object.values(transaction_category_enum_1.TransactionType).join(", ")}.`))
                    return;
            }
            // --- category ---
            if (!category || !Object.values(transaction_category_enum_1.TransactionCategory).includes(category)) {
                if (badRequest(res, `category must be one of: ${Object.values(transaction_category_enum_1.TransactionCategory).join(", ")}.`))
                    return;
            }
            // --- transactionDate ---
            // Original code only checked for presence, not validity.
            // new Date("not-a-date") produces Invalid Date with no error thrown —
            // it would be silently stored as a corrupt date in the DB.
            if (!transactionDate) {
                if (badRequest(res, "transactionDate is required."))
                    return;
            }
            const parsedDate = new Date(transactionDate);
            if (isNaN(parsedDate.getTime())) {
                if (badRequest(res, "transactionDate is not a valid date."))
                    return;
            }
            const result = await Transaction_service_1.TransactionService.createTransaction(type, amt, accountId.trim(), category, description?.trim() || undefined, parsedDate);
            res
                .status(201)
                .json(new apiResponse_1.ApiResponse(true, "Transaction created successfully.", result));
        }
        catch (error) {
            next(error);
        }
    }
    static async getTransactions(req, res, next) {
        try {
            const { page: rawPage = "1", limit: rawLimit = "10", type: rawType, category: rawCategory, accountId, search, startDate, endDate, } = req.query;
            // --- page ---
            const page = parsePositiveInt(rawPage, 1, Number.MAX_SAFE_INTEGER);
            if (page === null) {
                if (badRequest(res, "page must be a positive integer."))
                    return;
            }
            // --- limit ---
            // Cap at 100: without this a caller can request limit=1000000 which
            // causes TypeORM to issue TAKE 1000000 — effectively a full table scan.
            const limit = parsePositiveInt(rawLimit, 1, 100);
            if (limit === null) {
                if (badRequest(res, "limit must be an integer between 1 and 100."))
                    return;
            }
            // --- optional type filter ---
            if (rawType !== undefined && !Object.values(transaction_category_enum_1.TransactionType).includes(rawType)) {
                if (badRequest(res, `type must be one of: ${Object.values(transaction_category_enum_1.TransactionType).join(", ")}.`))
                    return;
            }
            // --- optional category filter ---
            if (rawCategory !== undefined && !Object.values(transaction_category_enum_1.TransactionCategory).includes(rawCategory)) {
                if (badRequest(res, `category must be one of: ${Object.values(transaction_category_enum_1.TransactionCategory).join(", ")}.`))
                    return;
            }
            // --- date range: require both or neither ---
            if ((startDate && !endDate) || (!startDate && endDate)) {
                if (badRequest(res, "Both startDate and endDate are required when filtering by date range."))
                    return;
            }
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                if (isNaN(start.getTime())) {
                    if (badRequest(res, "startDate is not a valid date."))
                        return;
                }
                if (isNaN(end.getTime())) {
                    if (badRequest(res, "endDate is not a valid date."))
                        return;
                }
                // Original code had no order check — a reversed range silently returns 0 rows.
                if (start > end) {
                    if (badRequest(res, "startDate must not be after endDate."))
                        return;
                }
            }
            // Build a fully-typed query object — no `any` reaches the service layer.
            const serviceQuery = {
                page: page,
                limit: limit,
                type: rawType,
                category: rawCategory,
                accountId,
                search,
                startDate,
                endDate,
            };
            const result = await Transaction_service_1.TransactionService.getTransactions(serviceQuery);
            res
                .status(200)
                .json(new apiResponse_1.ApiResponse(true, "Transactions fetched successfully.", result));
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteTransaction(req, res, next) {
        try {
            const { transactionId } = req.params;
            // Not validated at all in the original — undefined reached the service.
            if (!transactionId || typeof transactionId !== "string" || !transactionId.trim()) {
                if (badRequest(res, "transactionId param is required."))
                    return;
            }
            const result = await Transaction_service_1.TransactionService.deleteTransaction(transactionId.trim());
            res.status(200).json(new apiResponse_1.ApiResponse(true, result.message));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=Transaction.controller.js.map