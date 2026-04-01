"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const data_source_1 = require("../config/data-source");
const transaction_entity_1 = require("../entity/transaction.entity");
const transactionRepo = data_source_1.AppDataSource.getRepository(transaction_entity_1.Transaction);
class DashboardService {
    static async getDashboardSummary(accountId, year, month = new Date().getMonth() + 1 // ✅ Defaults to current month
    ) {
        // 1️⃣ Monthly Income vs Expense
        const monthlyRaw = await transactionRepo
            .createQueryBuilder("t")
            .select("EXTRACT(MONTH FROM t.transactionDate)", "month")
            .addSelect(`SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END)`, "income")
            .addSelect(`SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END)`, "expense")
            .where("t.accountId = :accountId", { accountId })
            .andWhere("EXTRACT(YEAR FROM t.transactionDate) = :year", { year })
            .groupBy("month")
            .orderBy("month", "ASC")
            .getRawMany();
        // Normalize → Always return 12 months
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const m = i + 1;
            const found = monthlyRaw.find((r) => Number(r.month) === m);
            const income = found ? Number(found.income) : 0;
            const expense = found ? Number(found.expense) : 0;
            return { month: m, income, expense, net: income - expense };
        });
        // 2️⃣ Total Income
        const totalIncomeRaw = await transactionRepo
            .createQueryBuilder("t")
            .select("SUM(t.amount)", "total")
            .where("t.accountId = :accountId", { accountId })
            .andWhere("t.type = 'credit'")
            .andWhere("EXTRACT(YEAR FROM t.transactionDate) = :year", { year })
            .getRawOne();
        const totalIncome = Number(totalIncomeRaw.total || 0);
        // 3️⃣ Total Expense
        const totalExpenseRaw = await transactionRepo
            .createQueryBuilder("t")
            .select("SUM(t.amount)", "total")
            .where("t.accountId = :accountId", { accountId })
            .andWhere("t.type = 'debit'")
            .andWhere("EXTRACT(YEAR FROM t.transactionDate) = :year", { year })
            .getRawOne();
        const totalExpense = Number(totalExpenseRaw.total || 0);
        // 4️⃣ Category-wise Expense Breakdown — filtered by specific month ✅
        const categoryBreakdown = await transactionRepo
            .createQueryBuilder("t")
            .select("tc.name", "category")
            .addSelect("SUM(t.amount)", "total")
            .leftJoin("t.category", "tc")
            .where("t.accountId = :accountId", { accountId })
            .andWhere("t.type = 'debit'")
            .andWhere("EXTRACT(YEAR FROM t.transactionDate) = :year", { year })
            .andWhere("EXTRACT(MONTH FROM t.transactionDate) = :month", { month }) // ✅ Filter by month
            .groupBy("tc.name")
            .orderBy("total", "DESC")
            .getRawMany();
        return {
            year,
            month, // ✅ Include month in response so caller knows which month was used
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