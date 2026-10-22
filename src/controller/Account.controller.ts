import { NextFunction ,Request,Response} from "express";
import { AccountService } from "../service/Account.service";
import { ApiResponse } from "../utils/apiResponse";
import { getAuthUserId } from "../middlewares/auth.middleware";


export class AccountController{
    static async createAccount(req:Request,res:Response,next:NextFunction){
        try{
            const {name,balance,type, creditLimit, statementDay, dueDay, interestRate}=req.body
            const userId=getAuthUserId(req)
            
            let creditCardInfo = undefined;
            if (type === 'credit') {
                 if (!creditLimit || !statementDay || !dueDay) {
                     throw new Error("Credit limit, statement day, and due day are required for credit cards");
                 }
                 creditCardInfo = { creditLimit, statementDay, dueDay, interestRate };
            }

            const account=await AccountService.createAccount(userId,name,type,balance, creditCardInfo)

            res.status(200).json(new ApiResponse(true,"Account Created Successfuly",account))
        }catch(error){
            next(error)
            console.log(error)
        }
    }
    static async getBalance(req:Request,res:Response,next:NextFunction){
        try{
            const {accountId}=req.params;

            const userId=getAuthUserId(req)
            const balance=await AccountService.getBalanceById(accountId, userId)

            res.status(201).json(new ApiResponse(true,"Amount Fetched successfuly",balance))
        }catch(error){
            next(error)
        }
    }

    static async getAllAccounts(req:Request,res:Response,next:NextFunction){
        try{
            const userId=getAuthUserId(req)

            const accounts=await AccountService.getAllAccounts(userId)

            res.status(201).json(new ApiResponse(true,"Accounts Feteched successfuly",accounts))
        }catch(error){
            next(error)
        }
    }
}