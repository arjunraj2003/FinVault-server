import { AppDataSource } from "../config/data-source";
import { Account } from "../entity/account.entity";
import { Transaction } from "../entity/transaction.entity";
import { TransactionCategory, TransactionType } from "../utils/transaction-category.enum";


export interface GetTransactionsQuery {
  page: number;
  limit: number;
  type?: TransactionType;
  category?: TransactionCategory;
  accountId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export class TransactionService {
  
  private static toFinancialString(value: number): string {
    return (Math.round(value * 100) / 100).toFixed(2);
  }

  static async createTransaction(
    type: TransactionType,
    amount: number,
    accountId: string,
    category: TransactionCategory,
    description: string | undefined,
    transactionDate: Date
  ) {

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Amount must be a finite positive number.");
    }

    if (!accountId || !accountId.trim()) {
      throw new Error("Account ID is required.");
    }

    return await AppDataSource.transaction(async (manager) => {
      const accountRepo = manager.getRepository(Account);
      const transactionRepo = manager.getRepository(Transaction);

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
        throw new Error(
          `Account ${accountId} has a corrupt balance value: "${account.balance}".`
        );
      }

      let newBalance: number;

      if (type === TransactionType.CREDIT) {
        newBalance = currentBalance + amount;
      } else {
        // DEBIT
        if (currentBalance < amount) {
          throw new Error(
            `Insufficient balance. Available: ${currentBalance.toFixed(2)}, Requested: ${amount.toFixed(2)}.`
          );
        }
        newBalance = currentBalance - amount;
      }

      // Use integer-safe rounding — never raw toFixed() on a float result.
      account.balance = TransactionService.toFinancialString(newBalance);

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

  static async getTransactions(query: GetTransactionsQuery) {
    const {
      page,
      limit,
      type,
      category,
      accountId,
      search,
      startDate,
      endDate,
    } = query;

    // These should already be validated by the controller, but guard here too.
    // A NaN skip/take in TypeORM silently removes the LIMIT clause — returning
    // the entire table, which is a serious performance and data-leak risk.
    if (!Number.isInteger(page) || page < 1) {
      throw new Error("page must be a positive integer.");
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("limit must be an integer between 1 and 100.");
    }

    const qb = AppDataSource.getRepository(Transaction)
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.account", "account");

    if (accountId) {
      qb.andWhere("account.id = :accountId", { accountId });
    }

    if (type) {
      qb.andWhere("transaction.type = :type", { type });
    }

    if (category) {
      qb.andWhere("transaction.category = :category", { category });
    }

    if (search) {
      qb.andWhere("transaction.description ILIKE :search", {
        search: `%${search}%`,
      });
    }

    if (startDate && endDate) {
      qb.andWhere(
        "transaction.transactionDate BETWEEN :startDate AND :endDate",
        { startDate, endDate }
      );
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

  static async deleteTransaction(transactionId: string) {
    if (!transactionId || !transactionId.trim()) {
      throw new Error("Transaction ID is required.");
    }
    return await AppDataSource.transaction(async (manager) => {
      const transaction = await manager.findOne(Transaction, {
        where: { id: transactionId },
        relations: ["account"],
        lock: { mode: "pessimistic_write" },
      });

      if (!transaction) {
        throw new Error("Transaction not found.");
      }

      const account = transaction.account;

      const currentBalance = Number(account.balance);
      if (isNaN(currentBalance)) {
        throw new Error(
          `Account has a corrupt balance value: "${account.balance}".`
        );
      }

      const amount = Number(transaction.amount);
      if (isNaN(amount)) {
        throw new Error(
          `Transaction has a corrupt amount value: "${transaction.amount}".`
        );
      }

     
      let newBalance: number;

      if (transaction.type === TransactionType.CREDIT) {
        newBalance = currentBalance - amount;
      } else {
        newBalance = currentBalance + amount;
      }

      account.balance = TransactionService.toFinancialString(newBalance);

      await manager.save(account);
      await manager.remove(transaction);

      return { message: "Transaction deleted successfully." };
    });
  }
}