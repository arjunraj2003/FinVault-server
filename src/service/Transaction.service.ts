import { AppDataSource } from "../config/data-source";
import { Account } from "../entity/Account.entity";
import {
  Transaction,
  TransactionType,
  TransactionCategory,
} from "../entity/Transaction.entity";

export class TransactionService {
  static async createTransaction(
    type: TransactionType,
    amount: number,
    accountId: string,
    category: TransactionCategory,
    description: string | undefined,
    transactionDate: Date
  ) {
    return await AppDataSource.transaction(async (manager) => {
      const accountRepo = manager.getRepository(Account);
      const transactionRepo = manager.getRepository(Transaction);

      const account = await accountRepo.findOne({
        where: { id: accountId },
      });

      if (!account) {
        throw new Error("Account not found");
      }

      let currentBalance = Number(account.balance);

      if (type === TransactionType.CREDIT) {
        currentBalance += amount;
      } else {
        if (currentBalance < amount) {
          throw new Error("Insufficient balance");
        }
        currentBalance -= amount;
      }

      account.balance = currentBalance.toFixed(2);

      const transaction = transactionRepo.create({
        type,
        amount: amount.toFixed(2),
        category,
        description,
        transactionDate,
        account,
      });

      await accountRepo.save(account);
      await transactionRepo.save(transaction);

      return {
        account,
        transaction,
      };
    });
  }

  static async getTransactions(query: any) {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      accountId,
      search,
      startDate,
      endDate,
    } = query;

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
      qb.andWhere("transaction.transactionDate BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });
    }

    qb.orderBy("transaction.transactionDate", "DESC");

    const skip = (Number(page) - 1) * Number(limit);

    qb.skip(skip).take(Number(limit));

    const [transactions, total] = await qb.getManyAndCount();

    const currentPage = Number(page);
    const perPage = Number(limit);
    const totalPages = Math.ceil(total / perPage);

    return {
      data: transactions,
      meta: {
        total,
        page: currentPage,
        limit: perPage,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1,
      },
    };
  }

  static async deleteTransaction(transactionId: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id: transactionId },
        relations: ["account"],
      });

      if (!transaction) throw new Error("Transaction not found");

      const account = transaction.account;

      let currentBalance = Number(account.balance);
      const amount = Number(transaction.amount);

      if (transaction.type === TransactionType.CREDIT) {
        currentBalance -= amount;
      } else {
        currentBalance += amount;
      }

      account.balance = currentBalance.toString();

      await queryRunner.manager.save(account);
      await queryRunner.manager.remove(transaction);

      await queryRunner.commitTransaction();

      return { message: "Transaction deleted successfully" };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

}