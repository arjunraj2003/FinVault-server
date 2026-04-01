"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetService = void 0;
const data_source_1 = require("../config/data-source");
const budget_entity_1 = require("../entity/budget.entity");
const transaction_entity_1 = require("../entity/transaction.entity");
const TransactionCategory_entity_1 = require("../entity/TransactionCategory.entity");
const user_entity_1 = require("../entity/user.entity");
const transaction_category_enum_1 = require("../utils/transaction-category.enum");
class BudgetService {
    constructor() {
        this.budgetRepository = data_source_1.AppDataSource.getRepository(budget_entity_1.Budget);
        this.transactionRepository = data_source_1.AppDataSource.getRepository(transaction_entity_1.Transaction);
        this.userRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
    }
    async createBudget(data) {
        const user = await this.userRepository.findOne({ where: { id: data.userId } });
        if (!user)
            throw new Error("User not found");
        const categoryRepo = data_source_1.AppDataSource.getRepository(TransactionCategory_entity_1.TransactionCategory);
        const category = await categoryRepo.findOne({ where: { id: data.categoryId, isActive: true } });
        if (!category)
            throw new Error(`Category with id "${data.categoryId}" not found.`);
        const newBudget = this.budgetRepository.create({
            amount: data.amount.toString(),
            category,
            startDate: data.startDate,
            endDate: data.endDate,
            user,
        });
        return await this.budgetRepository.save(newBudget);
    }
    async getBudgets(userId) {
        return await this.budgetRepository.find({
            where: { user: { id: userId } },
            relations: ["category"],
            order: { createdAt: "DESC" },
        });
    }
    async getBudgetById(budgetId, userId) {
        return await this.budgetRepository.findOne({
            where: { id: budgetId, user: { id: userId } },
            relations: ["category"],
        });
    }
    async updateBudget(budgetId, userId, updateData) {
        const budget = await this.getBudgetById(budgetId, userId);
        if (!budget)
            throw new Error("Budget not found");
        if (updateData.amount)
            budget.amount = updateData.amount.toString();
        if (updateData.categoryId) {
            const categoryRepo = data_source_1.AppDataSource.getRepository(TransactionCategory_entity_1.TransactionCategory);
            const category = await categoryRepo.findOne({ where: { id: updateData.categoryId, isActive: true } });
            if (!category)
                throw new Error(`Category with id "${updateData.categoryId}" not found.`);
            budget.category = category;
        }
        if (updateData.startDate)
            budget.startDate = updateData.startDate;
        if (updateData.endDate)
            budget.endDate = updateData.endDate;
        return await this.budgetRepository.save(budget);
    }
    async deleteBudget(budgetId, userId) {
        const budget = await this.getBudgetById(budgetId, userId);
        if (!budget)
            throw new Error("Budget not found");
        await this.budgetRepository.remove(budget);
        return { message: "Budget deleted successfully" };
    }
    async getBudgetProgress(budgetId, userId) {
        const budget = await this.getBudgetById(budgetId, userId);
        if (!budget)
            throw new Error("Budget not found");
        // Calculate progress by fetching all CREDIT transactions matching the category within the budget's dates.
        // Or DEBIT transactions? Given spending it's usually DEBIT. We'll find DEBIT transactions since spending involves outgoing money.
        // Checking the type of Transaction is usually DEBIT for expenses.
        const transactions = await this.transactionRepository
            .createQueryBuilder("transaction")
            .leftJoin("transaction.account", "account")
            .leftJoin("account.user", "user")
            .leftJoin("transaction.category", "category")
            .where("user.id = :userId", { userId })
            .andWhere("category.id = :categoryId", { categoryId: budget.category.id })
            .andWhere("transaction.type = :type", { type: transaction_category_enum_1.TransactionType.DEBIT }) // ✅ no more "as any"
            .andWhere("transaction.transactionDate BETWEEN :startDate AND :endDate", {
            startDate: budget.startDate,
            endDate: budget.endDate,
        })
            .getMany();
        const totalSpent = transactions.reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
        return {
            budget,
            totalSpent,
            remainingLimit: parseFloat(budget.amount) - totalSpent,
            progressPercentage: parseFloat(budget.amount) > 0 ? (totalSpent / parseFloat(budget.amount)) * 100 : 0
        };
    }
}
exports.BudgetService = BudgetService;
//# sourceMappingURL=Budget.service.js.map