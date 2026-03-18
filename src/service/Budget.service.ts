import { AppDataSource } from "../config/data-source";
import { Budget } from "../entity/budget.entity";
import { Transaction } from "../entity/transaction.entity";
import { TransactionCategory } from "../entity/TransactionCategory.entity";
import { User } from "../entity/user.entity";
import { Between } from "typeorm";
import { TransactionType } from "../utils/transaction-category.enum";

interface CreateBudgetParams {
    userId: string;
    amount: number;
    categoryId: string;
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

        const categoryRepo = AppDataSource.getRepository(TransactionCategory);
        const category = await categoryRepo.findOne({ where: { id: data.categoryId, isActive: true } });
        if (!category) throw new Error(`Category with id "${data.categoryId}" not found.`);

        const newBudget = this.budgetRepository.create({
            amount: data.amount.toString(),
            category,
            startDate: data.startDate,
            endDate: data.endDate,
            user,
        });

        return await this.budgetRepository.save(newBudget);
    }

    async getBudgets(userId: string) {
        return await this.budgetRepository.find({
            where: { user: { id: userId } },
            relations:["category"],
            order: { createdAt: "DESC" },
        });
    }

    async getBudgetById(budgetId: string, userId: string) {
        return await this.budgetRepository.findOne({
            where: { id: budgetId, user: { id: userId } },
            relations:["category"],
        });
    }

    async updateBudget(budgetId: string, userId: string, updateData: Partial<CreateBudgetParams>) {
        const budget = await this.getBudgetById(budgetId, userId);
        if (!budget) throw new Error("Budget not found");

        if (updateData.amount) budget.amount = updateData.amount.toString();
        if (updateData.categoryId) {
            const categoryRepo = AppDataSource.getRepository(TransactionCategory);
            const category = await categoryRepo.findOne({ where: { id: updateData.categoryId, isActive: true } });
            if (!category) throw new Error(`Category with id "${updateData.categoryId}" not found.`);
            budget.category = category;
        }
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
        const transactions = await this.transactionRepository
            .createQueryBuilder("transaction")
            .leftJoin("transaction.account", "account")
            .leftJoin("account.user", "user")
            .leftJoin("transaction.category", "category")
            .where("user.id = :userId", { userId })
            .andWhere("category.id = :categoryId", { categoryId: budget.category.id })
            .andWhere("transaction.type = :type", { type: TransactionType.DEBIT })   // ✅ no more "as any"
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
