import { AppDataSource } from "../config/data-source"
import { Account, AccountType } from "../entity/account.entity"
import { User } from "../entity/user.entity"
import { CreditCardDetails } from "../entity/CreditCardDetails.entity"

export interface CreateCreditCardDto {
    creditLimit: string;
    statementDay: number;
    dueDay: number;
    interestRate?: string;
}

const accountRepo = AppDataSource.getRepository(Account)
const userRepo = AppDataSource.getRepository(User)
export class AccountService {
    static async createAccount(userId: string, name: string, type: AccountType, balance: string, creditCardInfo?: CreateCreditCardDto) {

        const user = await userRepo.findOne({ where: { id: userId } })
        if (!user) throw new Error("User is not existing")
        console.log(balance)
        const parsedBalance = Number(balance);
        console.log(parsedBalance)
        if (isNaN(parsedBalance)) {
            throw new Error("Invalid balance amount");
        }
        
        let initialBalance = parsedBalance;
        if (type === AccountType.CREDIT && creditCardInfo) {
            initialBalance = Number(creditCardInfo.creditLimit) - parsedBalance;
            if (initialBalance < 0) {
                throw new Error("Initial debt cannot exceed credit limit.");
            }
        }

        const existing = await accountRepo.findOne({
            where: { user: { id: userId }, name },
        });

        if (existing) {
            throw new Error("Account with this name already exists");
        }

        const account = accountRepo.create({
            name,
            type,
            balance: initialBalance.toString(),
            user,
        });

        if (type === AccountType.CREDIT && creditCardInfo) {
            account.creditCardDetails = {
                creditLimit: creditCardInfo.creditLimit,
                statementDay: creditCardInfo.statementDay,
                dueDay: creditCardInfo.dueDay,
                interestRate: creditCardInfo.interestRate,
            } as CreditCardDetails;
        }

        await accountRepo.save(account);

        return account;
    }

    static async getBalanceById(AccountId: string) {
        const balance = await accountRepo.findOne({ 
            where: { id: AccountId },
            relations: ["creditCardDetails"]
        })
        return balance
    }

    static async getAllAccounts(userId: string) {
        const accounts = await accountRepo.find({ 
            where: { user: { id: userId } },
            relations: ["creditCardDetails"]
        })
        return accounts
    }
}