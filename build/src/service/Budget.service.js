"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetService = void 0;
const data_source_1 = require("../config/data-source");
const budget_entity_1 = require("../entity/budget.entity");
const transaction_entity_1 = require("../entity/transaction.entity");
const user_entity_1 = require("../entity/user.entity");
const typeorm_1 = require("typeorm");
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
        const newBudget = this.budgetRepository.create({
            amount: data.amount.toString(),
            category: data.category,
            startDate: data.startDate,
            endDate: data.endDate,
            user,
        });
        return await this.budgetRepository.save(newBudget);
    }
    async getBudgets(userId) {
        return await this.budgetRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: "DESC" },
        });
    }
    async getBudgetById(budgetId, userId) {
        return await this.budgetRepository.findOne({
            where: { id: budgetId, user: { id: userId } },
        });
    }
    async updateBudget(budgetId, userId, updateData) {
        const budget = await this.getBudgetById(budgetId, userId);
        if (!budget)
            throw new Error("Budget not found");
        if (updateData.amount)
            budget.amount = updateData.amount.toString();
        if (updateData.category)
            budget.category = updateData.category;
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
        const transactions = await this.transactionRepository.find({
            where: {
                account: { user: { id: userId } },
                category: budget.category,
                type: "debit", // Only calculate expenses
                transactionDate: (0, typeorm_1.Between)(budget.startDate, budget.endDate),
            },
            relations: ["account", "account.user"]
        });
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