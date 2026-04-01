"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const data_source_1 = require("../config/data-source");
const account_entity_1 = require("../entity/account.entity");
const transaction_entity_1 = require("../entity/transaction.entity");
const TransactionCategory_entity_1 = require("../entity/TransactionCategory.entity");
const transaction_category_enum_1 = require("../utils/transaction-category.enum");
class TransactionService {
    static toFinancialString(value) {
        return (Math.round(value * 100) / 100).toFixed(2);
    }
    static async createTransaction(type, amount, accountId, categoryId, description, transactionDate) {
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error("Amount must be a finite positive number.");
        }
        if (!accountId || !accountId.trim()) {
            throw new Error("Account ID is required.");
        }
        return await data_source_1.AppDataSource.transaction(async (manager) => {
            const accountRepo = manager.getRepository(account_entity_1.Account);
            const transactionRepo = manager.getRepository(transaction_entity_1.Transaction);
            const account = await accountRepo.findOne({
                where: { id: accountId },
                lock: { mode: "pessimistic_write" },
            });
            if (!account) {
                throw new Error("Account not found.");
            }
            // Parse stored balance string safely.
            // Number("") returns 0 which is a safe default; NaN would corrupt the balance.
            const currentBalance = Number(account.balance);
            if (isNaN(currentBalance)) {
                // This indicates data corruption in the DB — surface it loudly.
                throw new Error(`Account ${accountId} has a corrupt balance value: "${account.balance}".`);
            }
            let newBalance;
            if (type === transaction_category_enum_1.TransactionType.CREDIT) {
                newBalance = currentBalance + amount;
            }
            else {
                // DEBIT
                if (currentBalance < amount) {
                    throw new Error(`Insufficient balance. Available: ${currentBalance.toFixed(2)}, Requested: ${amount.toFixed(2)}.`);
                }
                newBalance = currentBalance - amount;
            }
            // Use integer-safe rounding — never raw toFixed() on a float result.
            account.balance = TransactionService.toFinancialString(newBalance);
            const categoryRepo = manager.getRepository(TransactionCategory_entity_1.TransactionCategory);
            const category = await categoryRepo.findOne({ where: { id: categoryId, isActive: true } });
            if (!category) {
                throw new Error(`Category with id ${categoryId} not found.`);
            }
            const transaction = transactionRepo.create({
                type,
                amount: TransactionService.toFinancialString(amount),
                category,
                description,
                transactionDate,
                account,
            });
            await accountRepo.save(account);
            const savedTransaction = await transactionRepo.save(transaction);
            return {
                account,
                transaction: savedTransaction,
            };
        });
    }
    static async getTransactions(query) {
        const { page, limit, type, categoryId, accountId, search, startDate, endDate, } = query;
        // These should already be validated by the controller, but guard here too.
        // A NaN skip/take in TypeORM silently removes the LIMIT clause — returning
        // the entire table, which is a serious performance and data-leak risk.
        if (!Number.isInteger(page) || page < 1) {
            throw new Error("page must be a positive integer.");
        }
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            throw new Error("limit must be an integer between 1 and 100.");
        }
        const qb = data_source_1.AppDataSource.getRepository(transaction_entity_1.Transaction)
            .createQueryBuilder("transaction")
            .leftJoinAndSelect("transaction.account", "account")
            .leftJoinAndSelect("transaction.category", "category");
        if (accountId) {
            qb.andWhere("account.id = :accountId", { accountId });
        }
        if (type) {
            qb.andWhere("transaction.type = :type", { type });
        }
        if (categoryId) {
            qb.andWhere("category.id = :categoryId", { categoryId });
        }
        if (search) {
            qb.andWhere("transaction.description ILIKE :search", {
                search: `%${search}%`,
            });
        }
        if (startDate && endDate) {
            qb.andWhere("transaction.transactionDate BETWEEN :startDate AND :endDate", { startDate, endDate });
        }
        qb.orderBy("transaction.transactionDate", "DESC");
        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);
        const [transactions, total] = await qb.getManyAndCount();
        const totalPages = Math.ceil(total / limit);
        return {
            data: transactions,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    }
    static async deleteTransaction(transactionId) {
        if (!transactionId || !transactionId.trim()) {
            throw new Error("Transaction ID is required.");
        }
        return await data_source_1.AppDataSource.transaction(async (manager) => {
            // Step 1: fetch transaction with NO lock first — just to get accountId
            const transactionPlain = await manager.findOne(transaction_entity_1.Transaction, {
                where: { id: transactionId },
            });
            if (!transactionPlain) {
                throw new Error("Transaction not found.");
            }
            // Step 2: get accountId directly from the FK column
            const accountId = transactionPlain.accountId; // ✅ raw FK column
            // Step 3: lock account row separately
            const account = await manager.findOne(account_entity_1.Account, {
                where: { id: accountId },
                lock: { mode: "pessimistic_write" },
            });
            if (!account) {
                throw new Error("Account not found.");
            }
            // Step 4: now lock the transaction row separately
            const transaction = await manager.findOne(transaction_entity_1.Transaction, {
                where: { id: transactionId },
                lock: { mode: "pessimistic_write" },
            });
            if (!transaction) {
                throw new Error("Transaction not found.");
            }
            const currentBalance = Number(account.balance);
            if (isNaN(currentBalance)) {
                throw new Error(`Account has a corrupt balance value: "${account.balance}".`);
            }
            const amount = Number(transaction.amount);
            if (isNaN(amount)) {
                throw new Error(`Transaction has a corrupt amount value: "${transaction.amount}".`);
            }
            let newBalance;
            if (transaction.type === transaction_category_enum_1.TransactionType.CREDIT) {
                newBalance = currentBalance - amount;
            }
            else {
                newBalance = currentBalance + amount;
            }
            account.balance = TransactionService.toFinancialString(newBalance);
            await manager.save(account);
            await manager.remove(transaction);
            return { message: "Transaction deleted successfully." };
        });
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=Transaction.service.js.map