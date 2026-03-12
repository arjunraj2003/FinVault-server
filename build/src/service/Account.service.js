"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const data_source_1 = require("../config/data-source");
const account_entity_1 = require("../entity/account.entity");
const user_entity_1 = require("../entity/user.entity");
const accountRepo = data_source_1.AppDataSource.getRepository(account_entity_1.Account);
const userRepo = data_source_1.AppDataSource.getRepository(user_entity_1.User);
class AccountService {
    static async createAccount(userId, name, type, balance) {
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new Error("User is not existing");
        console.log(balance);
        const parsedBalance = Number(balance);
        console.log(parsedBalance);
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
    static async getBalanceById(AccountId) {
        const balance = await accountRepo.findOne({ where: { id: AccountId } });
        return balance;
    }
    static async getAllAccounts(userId) {
        const accounts = await accountRepo.find({ where: { user: { id: userId } } });
        return accounts;
    }
}
exports.AccountService = AccountService;
//# sourceMappingURL=Account.service.js.map