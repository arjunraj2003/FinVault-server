import { NextFunction, Request, Response } from "express";
import {
  TransactionService,
  GetTransactionsQuery,
} from "../service/Transaction.service";
import { ApiResponse } from "../utils/apiResponse";
import {
  TransactionType,
  TransactionCategory,
} from "../entity/Transaction.entity";

// ---------------------------------------------------------------------------
// Request body / query shapes
// ---------------------------------------------------------------------------

interface CreateTransactionBody {
  type: TransactionType;
  amount: number | string; // comes in as string from JSON body — we coerce safely
  accountId: string;
  category: TransactionCategory;
  description?: string;
  transactionDate: string;
}

// Express types req.query values as string | string[] | ParsedQs — keep explicit.
interface RawGetTransactionsQuery {
  page?: string;
  limit?: string;
  type?: string;
  category?: string;
  accountId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sends a 400 Bad Request response and returns true so the caller can bail out.
 * Using res.status(400).json() instead of throw new Error() ensures validation
 * failures are returned as 400s — not 500s — without relying on the error
 * middleware knowing the difference.
 */
function badRequest(res: Response, message: string): true {
  res.status(400).json(new ApiResponse(false, message));
  return true;
}

/**
 * Parses a query string value that must be a positive integer within [min, max].
 * Returns the parsed number, or null if invalid.
 */
function parsePositiveInt(
  value: string | undefined,
  min: number,
  max: number
): number | null {
  if (value === undefined) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

export class TransactionController {
  static async createTransaction(
    req: Request<{}, {}, CreateTransactionBody>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        type,
        amount,
        accountId,
        category,
        description,
        transactionDate,
      } = req.body;

      // --- accountId ---
      // Missing entirely in original code — undefined was silently forwarded
      // to the service which then threw a generic 500.
      if (!accountId || typeof accountId !== "string" || !accountId.trim()) {
        if (badRequest(res, "accountId is required.")) return;
      }

      // --- amount ---
      // Convert here once; never re-convert downstream.
      // Check isFinite so that "Infinity" / "NaN" strings are rejected.
      const amt = Number(amount);
      if (!amount || !Number.isFinite(amt) || amt <= 0) {
        if (badRequest(res, "amount must be a finite number greater than 0.")) return;
      }

      // --- type ---
      if (!type || !Object.values(TransactionType).includes(type)) {
        if (badRequest(res, `type must be one of: ${Object.values(TransactionType).join(", ")}.`)) return;
      }

      // --- category ---
      if (!category || !Object.values(TransactionCategory).includes(category)) {
        if (badRequest(res, `category must be one of: ${Object.values(TransactionCategory).join(", ")}.`)) return;
      }

      // --- transactionDate ---
      // Original code only checked for presence, not validity.
      // new Date("not-a-date") produces Invalid Date with no error thrown —
      // it would be silently stored as a corrupt date in the DB.
      if (!transactionDate) {
        if (badRequest(res, "transactionDate is required.")) return;
      }

      const parsedDate = new Date(transactionDate as string);
      if (isNaN(parsedDate.getTime())) {
        if (badRequest(res, "transactionDate is not a valid date.")) return;
      }

      const result = await TransactionService.createTransaction(
        type,
        amt,
        accountId.trim(),
        category,
        description?.trim() || undefined,
        parsedDate
      );

      res
        .status(201)
        .json(new ApiResponse(true, "Transaction created successfully.", result));
    } catch (error) {
      next(error);
    }
  }

  static async getTransactions(
    req: Request<{}, {}, {}, RawGetTransactionsQuery>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        page: rawPage = "1",
        limit: rawLimit = "10",
        type: rawType,
        category: rawCategory,
        accountId,
        search,
        startDate,
        endDate,
      } = req.query;

      // --- page ---
      const page = parsePositiveInt(rawPage, 1, Number.MAX_SAFE_INTEGER);
      if (page === null) {
        if (badRequest(res, "page must be a positive integer.")) return;
      }

      // --- limit ---
      // Cap at 100: without this a caller can request limit=1000000 which
      // causes TypeORM to issue TAKE 1000000 — effectively a full table scan.
      const limit = parsePositiveInt(rawLimit, 1, 100);
      if (limit === null) {
        if (badRequest(res, "limit must be an integer between 1 and 100.")) return;
      }

      // --- optional type filter ---
      if (rawType !== undefined && !Object.values(TransactionType).includes(rawType as TransactionType)) {
        if (badRequest(res, `type must be one of: ${Object.values(TransactionType).join(", ")}.`)) return;
      }

      // --- optional category filter ---
      if (rawCategory !== undefined && !Object.values(TransactionCategory).includes(rawCategory as TransactionCategory)) {
        if (badRequest(res, `category must be one of: ${Object.values(TransactionCategory).join(", ")}.`)) return;
      }

      // --- date range: require both or neither ---
      if ((startDate && !endDate) || (!startDate && endDate)) {
        if (badRequest(res, "Both startDate and endDate are required when filtering by date range.")) return;
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime())) {
          if (badRequest(res, "startDate is not a valid date.")) return;
        }
        if (isNaN(end.getTime())) {
          if (badRequest(res, "endDate is not a valid date.")) return;
        }
        // Original code had no order check — a reversed range silently returns 0 rows.
        if (start > end) {
          if (badRequest(res, "startDate must not be after endDate.")) return;
        }
      }

      // Build a fully-typed query object — no `any` reaches the service layer.
      const serviceQuery: GetTransactionsQuery = {
        page: page as number,
        limit: limit as number,
        type: rawType as TransactionType | undefined,
        category: rawCategory as TransactionCategory | undefined,
        accountId,
        search,
        startDate,
        endDate,
      };

      const result = await TransactionService.getTransactions(serviceQuery);

      res
        .status(200)
        .json(new ApiResponse(true, "Transactions fetched successfully.", result));
    } catch (error) {
      next(error);
    }
  }

  static async deleteTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { transactionId } = req.params;

      // Not validated at all in the original — undefined reached the service.
      if (!transactionId || typeof transactionId !== "string" || !transactionId.trim()) {
        if (badRequest(res, "transactionId param is required.")) return;
      }

      const result = await TransactionService.deleteTransaction(transactionId.trim());

      res.status(200).json(new ApiResponse(true, result.message));
    } catch (error) {
      next(error);
    }
  }
}