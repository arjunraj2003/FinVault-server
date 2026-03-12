"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const Account_service_1 = require("../service/Account.service");
const apiResponse_1 = require("../utils/apiResponse");
class AccountController {
    static async createAccount(req, res, next) {
        try {
            const { name, balance, type } = req.body;
            const userId = req.user.id;
            const account = await Account_service_1.AccountService.createAccount(userId, name, type, balance);
            res.status(200).json(new apiResponse_1.ApiResponse(true, "Account Created Successfuly", account));
        }
        catch (error) {
            next(error);
            console.log(error);
        }
    }
    static async getBalance(req, res, next) {
        try {
            const { accountId } = req.params;
            const balance = await Account_service_1.AccountService.getBalanceById(accountId);
            res.status(201).json(new apiResponse_1.ApiResponse(true, "Amount Fetched successfuly", balance));
        }
        catch (error) {
            next(error);
        }
    }
    static async getAllAccounts(req, res, next) {
        try {
            const userId = req.user.id;
            const accounts = await Account_service_1.AccountService.getAllAccounts(userId);
            res.status(201).json(new apiResponse_1.ApiResponse(true, "Accounts Feteched successfuly", accounts));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AccountController = AccountController;
//# sourceMappingURL=Account.controller.js.map