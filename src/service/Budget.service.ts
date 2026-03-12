import { AppDataSource } from "../config/data-source";
import { Budget } from "../entity/budget.entity";
import { Transaction } from "../entity/transaction.entity";
import { User } from "../entity/user.entity";
import { Between } from "typeorm";

interface CreateBudgetParams {
    userId: string;
    amount: number;
    category: any;
    startDate: Date;
    endDate: Date;
}

export class BudgetService {
    private budgetRepository = AppDataSource.getRepository(Budget);
    private transactionRepository = AppDataSource.getRepository(Transaction);
    private userRepository = AppDataSource.getRepository(User);

    async createBudget(data: CreateBudgetParams) {
        const user = await this.userRepository.findOne({ where: { id: data.userId } });
        if (!user) throw new Error("User not found");

        const newBudget = this.budgetRepository.create({
            amount: data.amount.toString(),
            category: data.category,
            startDate: data.startDate,
            endDate: data.endDate,
            user,
        });

        return await this.budgetRepository.save(newBudget);
    }

    async getBudgets(userId: string) {
        return await this.budgetRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: "DESC" },
        });
    }

    async getBudgetById(budgetId: string, userId: string) {
        return await this.budgetRepository.findOne({
            where: { id: budgetId, user: { id: userId } },
        });
    }

    async updateBudget(budgetId: string, userId: string, updateData: Partial<CreateBudgetParams>) {
        const budget = await this.getBudgetById(budgetId, userId);
        if (!budget) throw new Error("Budget not found");

        if (updateData.amount) budget.amount = updateData.amount.toString();
        if (updateData.category) budget.category = updateData.category;
        if (updateData.startDate) budget.startDate = updateData.startDate;
        if (updateData.endDate) budget.endDate = updateData.endDate;

        return await this.budgetRepository.save(budget);
    }

    async deleteBudget(budgetId: string, userId: string) {
        const budget = await this.getBudgetById(budgetId, userId);
        if (!budget) throw new Error("Budget not found");

        await this.budgetRepository.remove(budget);
        return { message: "Budget deleted successfully" };
    }

    async getBudgetProgress(budgetId: string, userId: string) {
        const budget = await this.getBudgetById(budgetId, userId);
        if (!budget) throw new Error("Budget not found");

        // Calculate progress by fetching all CREDIT transactions matching the category within the budget's dates.
        // Or DEBIT transactions? Given spending it's usually DEBIT. We'll find DEBIT transactions since spending involves outgoing money.
        // Checking the type of Transaction is usually DEBIT for expenses.
        const transactions = await this.transactionRepository.find({
            where: {
                account: { user: { id: userId } },
                category: budget.category,
                type: "debit" as any, // Only calculate expenses
                transactionDate: Between(budget.startDate, budget.endDate),
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
