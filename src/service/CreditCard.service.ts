import { AppDataSource } from "../config/data-source";
import { CreditCardStatement } from "../entity/CreditCardStatement.entity";
import { Account, AccountType } from "../entity/account.entity";
import { Transaction } from "../entity/transaction.entity";
import { TransactionType } from "../utils/transaction-category.enum";
import { MoreThanOrEqual } from "typeorm";

const statementRepo = AppDataSource.getRepository(CreditCardStatement);
const accountRepo = AppDataSource.getRepository(Account);
const transactionRepo = AppDataSource.getRepository(Transaction);

export class CreditCardService {
    static async getCreditCardSummary(accountId: string, userId: string) {
        const account = await accountRepo.findOne({
            where: { id: accountId, user: { id: userId }, type: AccountType.CREDIT },
            relations: ["creditCardDetails"]
        });

        if (!account || !account.creditCardDetails) {
            throw new Error("Credit card not found or unauthorized");
        }

        const details = account.creditCardDetails;
        
        const now = new Date();
        let cycleStartYear = now.getFullYear();
        let cycleStartMonth = now.getMonth();
        
        if (now.getDate() < details.statementDay) {
            cycleStartMonth -= 1;
            if (cycleStartMonth < 0) {
                cycleStartMonth = 11;
                cycleStartYear -= 1;
            }
        }
        
        const cycleStartDate = new Date(cycleStartYear, cycleStartMonth, details.statementDay);

        const recentTransactions = await transactionRepo.find({
            where: {
                account: { id: accountId },
                transactionDate: MoreThanOrEqual(cycleStartDate)
            }
        });

        let unbilledAmount = 0;
        for (const t of recentTransactions) {
            // Debit means expense (adds to unbilled)
            if (t.type === TransactionType.DEBIT) {
                unbilledAmount += Number(t.amount);
            } 
            // Credit means payment (reduces unbilled)
            else if (t.type === TransactionType.CREDIT) {
                unbilledAmount -= Number(t.amount);
            }
        }

        const statements = await statementRepo.find({
            where: { accountId: accountId },
            order: { statementDate: "DESC" }
        });

        const availableCredit = Number(account.balance);
        const outstandingDebt = Number(details.creditLimit) - availableCredit;

        return {
            creditLimit: Number(details.creditLimit),
            availableCredit: availableCredit,
            currentBalance: outstandingDebt,
            unbilledAmount: unbilledAmount > 0 ? unbilledAmount : 0,
            cycleStartDate,
            statementDay: details.statementDay,
            dueDay: details.dueDay,
            recentStatements: statements
        };
    }
}
