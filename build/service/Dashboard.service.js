"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const data_source_1 = require("../config/data-source");
const Transaction_entity_1 = require("../entity/Transaction.entity");
const transactionRepo = data_source_1.AppDataSource.getRepository(Transaction_entity_1.Transaction);
class DashboardService {
    static async getDashboardSummary(accountId, year) {
        // 1️⃣ Monthly Income vs Expense
        const monthlyRaw = await transactionRepo
            .createQueryBuilder("t")
            .select("EXTRACT(MONTH FROM t.createdAt)", "month")
            .addSelect(`SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END)`, "income")
            .addSelect(`SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END)`, "expense")
            .where("t.accountId = :accountId", { accountId })
            .andWhere("EXTRACT(YEAR FROM t.createdAt) = :year", { year })
            .groupBy("month")
            .orderBy("month", "ASC")
            .getRawMany();
        // Normalize → Always return 12 months
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const found = monthlyRaw.find((m) => Number(m.month) === month);
            const income = found ? Number(found.income) : 0;
            const expense = found ? Number(found.expense) : 0;
            return {
                month,
                income,
                expense,
                net: income - expense,
            };
        });
        // 2️⃣ Total Income
        const totalIncomeRaw = await transactionRepo
            .createQueryBuilder("t")
            .select("SUM(t.amount)", "total")
            .where("t.accountId = :accountId", { accountId })
            .andWhere("t.type = 'credit'")
            .andWhere("EXTRACT(YEAR FROM t.createdAt) = :year", { year })
            .getRawOne();
        const totalIncome = Number(totalIncomeRaw.total || 0);
        // 3️⃣ Total Expense
        const totalExpenseRaw = await transactionRepo
            .createQueryBuilder("t")
            .select("SUM(t.amount)", "total")
            .where("t.accountId = :accountId", { accountId })
            .andWhere("t.type = 'debit'")
            .andWhere("EXTRACT(YEAR FROM t.createdAt) = :year", { year })
            .getRawOne();
        const totalExpense = Number(totalExpenseRaw.total || 0);
        // 4️⃣ Category-wise Expense Breakdown
        const categoryBreakdown = await transactionRepo
            .createQueryBuilder("t")
            .select("t.category", "category")
            .addSelect("SUM(t.amount)", "total")
            .where("t.accountId = :accountId", { accountId })
            .andWhere("t.type = 'debit'")
            .andWhere("EXTRACT(YEAR FROM t.createdAt) = :year", { year })
            .groupBy("t.category")
            .orderBy("total", "DESC")
            .getRawMany();
        return {
            year,
            monthlyData,
            totals: {
                income: totalIncome,
                expense: totalExpense,
                net: totalIncome - totalExpense,
            },
            categoryBreakdown: categoryBreakdown.map((c) => ({
                category: c.category,
                total: Number(c.total),
            })),
        };
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=Dashboard.service.js.map