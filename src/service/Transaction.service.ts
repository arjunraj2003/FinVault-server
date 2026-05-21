import { randomBytes } from "crypto";
import { AppDataSource } from "../config/data-source";
import { Account } from "../entity/account.entity";
import { Transaction } from "../entity/transaction.entity";
import { TransactionCategory } from "../entity/TransactionCategory.entity";
import { TransactionType } from "../utils/transaction-category.enum";

export interface GetTransactionsQuery {
  page: number;
  limit: number;
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export class TransactionService {

  private static toFinancialString(value: number): string {
    return (Math.round(value * 100) / 100).toFixed(2);
  }

  // Compatible UUID v4 generator for older Node.js runtimes (e.g. Node v12)
  private static generateUUID(): string {
    const bytes = randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122
    const hex = bytes.toString("hex");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  static async createTransaction(
    type: TransactionType,
    amount: number,
    accountId: string,
    categoryId: string,
    description: string | undefined,
    transactionDate: Date,
    sourceAccountId?: string
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

      let account: Account | null = null;
      let sourceAccount: Account | null = null;

      // 1. Concurrency deadlocking prevention via deterministic locking order
      if (sourceAccountId && sourceAccountId.trim()) {
        const sortedIds = [accountId, sourceAccountId].sort();
        const firstId = sortedIds[0];
        const secondId = sortedIds[1];

        const firstAccount = await accountRepo.findOne({
          where: { id: firstId },
          lock: { mode: "pessimistic_write" },
        });

        const secondAccount = await accountRepo.findOne({
          where: { id: secondId },
          lock: { mode: "pessimistic_write" },
        });

        if (firstId === accountId) {
          account = firstAccount;
          sourceAccount = secondAccount;
        } else {
          account = secondAccount;
          sourceAccount = firstAccount;
        }
      } else {
        account = await accountRepo.findOne({
          where: { id: accountId },
          lock: { mode: "pessimistic_write" },
        });
      }

      if (!account) {
        throw new Error("Account not found.");
      }

      // Load creditCardDetails separately without a lock
      const accountWithDetails = await accountRepo.findOne({
        where: { id: accountId },
        relations: ["creditCardDetails"],
      });
      account.creditCardDetails = accountWithDetails?.creditCardDetails;

      // Parse stored balance string safely.
      const currentBalance = Number(account.balance);
      if (isNaN(currentBalance)) {
        throw new Error(
          `Account ${accountId} has a corrupt balance value: "${account.balance}".`
        );
      }

      let newBalance: number;

      if (type === TransactionType.CREDIT) {
        if (account.type === "credit" && account.creditCardDetails) {
          const limit = Number(account.creditCardDetails.creditLimit);
          if (currentBalance + amount > limit) {
            const maxPayment = limit - currentBalance;
            throw new Error(`Repayment amount exceeds the outstanding bill. Maximum payment allowed is ${maxPayment.toFixed(2)}.`);
          }
        }
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

      account.balance = TransactionService.toFinancialString(newBalance);
      
      if (sourceAccount) {
        const sourceBalance = Number(sourceAccount.balance);
        if (isNaN(sourceBalance)) {
          throw new Error(`Source account has a corrupt balance.`);
        }

        if (sourceBalance < amount) {
          throw new Error(`Insufficient balance in the source account (${sourceAccount.name}).`);
        }

        sourceAccount.balance = TransactionService.toFinancialString(sourceBalance - amount);
        await accountRepo.save(sourceAccount);
      }

      const categoryRepo = manager.getRepository(TransactionCategory);
      const category = await categoryRepo.findOne({ where: { id: categoryId, isActive: true } });
      if (!category) {
        throw new Error(`Category with id ${categoryId} not found.`);
      }

      // Generate a unique identifier for linked transfer legs
      const transferGroupId = sourceAccount ? TransactionService.generateUUID() : null;

      const transaction = transactionRepo.create({
        type,
        amount: TransactionService.toFinancialString(amount),
        category,
        description: sourceAccount ? `Payment from ${sourceAccount.name}${description ? ' - ' + description : ''}` : description,
        transactionDate,
        account,
        transferGroupId,
      });

      await accountRepo.save(account);
      const savedTransaction = await transactionRepo.save(transaction);
      
      let savedSourceTransaction = null;
      if (sourceAccount) {
        const sourceTransaction = transactionRepo.create({
          type: TransactionType.DEBIT,
          amount: TransactionService.toFinancialString(amount),
          category,
          description: `Payment to ${account.name}`,
          transactionDate,
          account: sourceAccount,
          transferGroupId,
        });
        savedSourceTransaction = await transactionRepo.save(sourceTransaction);
      }

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
      categoryId,
      accountId,
      search,
      startDate,
      endDate,
    } = query;

    if (!Number.isInteger(page) || page < 1) {
      throw new Error("page must be a positive integer.");
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("limit must be an integer between 1 and 100.");
    }

    const qb = AppDataSource.getRepository(Transaction)
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
      const accountRepo = manager.getRepository(Account);
      const transactionRepo = manager.getRepository(Transaction);

      // Fetch transaction with NO lock first to get accountId and transferGroupId
      const transactionPlain = await transactionRepo.findOne({
        where: { id: transactionId },
      });

      if (!transactionPlain) {
        throw new Error("Transaction not found.");
      }

      const transferGroupId = transactionPlain.transferGroupId;

      if (transferGroupId) {
        // Fetch all transactions under this transfer group
        const transferTransactions = await transactionRepo.find({
          where: { transferGroupId },
        });

        // Ensure deterministic locking order for all unique accounts involved
        const uniqueAccountIds = Array.from(new Set(transferTransactions.map(t => t.accountId))).sort();
        const accountsMap: Record<string, Account> = {};

        for (const accId of uniqueAccountIds) {
          const acc = await accountRepo.findOne({
            where: { id: accId },
            lock: { mode: "pessimistic_write" },
          });
          if (!acc) {
            throw new Error(`Account associated with transfer was not found.`);
          }
          accountsMap[accId] = acc;
        }

        // Lock all transactions within the group to execute deletion
        const lockedTransactions = [];
        for (const t of transferTransactions) {
          const lockedT = await transactionRepo.findOne({
            where: { id: t.id },
            lock: { mode: "pessimistic_write" },
          });
          if (lockedT) {
            lockedTransactions.push(lockedT);
          }
        }

        // Process adjustments for all transactions in the group atomically
        for (const t of lockedTransactions) {
          const account = accountsMap[t.accountId];
          const currentBalance = Number(account.balance);
          if (isNaN(currentBalance)) {
            throw new Error(`Account has a corrupt balance value.`);
          }

          const amount = Number(t.amount);
          if (isNaN(amount)) {
            throw new Error(`Transaction has a corrupt amount value.`);
          }

          // Reverse balance adjustment
          let newBalance: number;
          if (t.type === TransactionType.CREDIT) {
            newBalance = currentBalance - amount;
          } else {
            newBalance = currentBalance + amount;
          }

          account.balance = TransactionService.toFinancialString(newBalance);
          await accountRepo.save(account);
          await transactionRepo.remove(t);
        }

        return { message: "Transfer transactions deleted successfully." };
      }

      // Normal single transaction deletion
      const accountId = transactionPlain.accountId;

      // Lock account row
      const account = await accountRepo.findOne({
        where: { id: accountId },
        lock: { mode: "pessimistic_write" },
      });

      if (!account) {
        throw new Error("Account not found.");
      }

      // Lock transaction row
      const transaction = await transactionRepo.findOne({
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

      let newBalance: number;
      if (transaction.type === TransactionType.CREDIT) {
        newBalance = currentBalance - amount;
      } else {
        newBalance = currentBalance + amount;
      }

      account.balance = TransactionService.toFinancialString(newBalance);

      await accountRepo.save(account);
      await transactionRepo.remove(transaction);

      return { message: "Transaction deleted successfully." };
    });
  }
}