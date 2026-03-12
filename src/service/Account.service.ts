import { AppDataSource } from "../config/data-source"
import { Account, AccountType } from "../entity/account.entity"
import { User } from "../entity/user.entity"

const accountRepo = AppDataSource.getRepository(Account)
const userRepo = AppDataSource.getRepository(User)
export class AccountService {
    static async createAccount(userId: string, name: string, type: AccountType, balance: string) {

        const user = await userRepo.findOne({ where: { id: userId } })
        if (!user) throw new Error("User is not existing")
        console.log(balance)
        const parsedBalance = Number(balance);
        console.log(parsedBalance)
        if (isNaN(parsedBalance) || parsedBalance < 0) {
            throw new Error("Invalid balance amount");
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
            balance: parsedBalance.toString(),
            user,
        });

        await accountRepo.save(account);

        return account;
    }

    static async getBalanceById(AccountId: string) {
        const balance = await accountRepo.findOne({ where: { id: AccountId } })
        return balance
    }

    static async getAllAccounts(userId: string) {
        const accounts = await accountRepo.find({ where: { user: { id: userId } } })
        return accounts
    }
}