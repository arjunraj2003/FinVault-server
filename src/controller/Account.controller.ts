import { NextFunction ,Request,Response} from "express";
import { AccountService } from "../service/Account.service";
import { ApiResponse } from "../utils/apiResponse";


export class AccountController{
    static async createAccount(req:Request,res:Response,next:NextFunction){
        try{
            const {name,balance,type}=req.body
            const userId=(req as any).user.id
            const account=await AccountService.createAccount(userId,name,type,balance)

            res.status(200).json(new ApiResponse(true,"Account Created Successfuly",account))
        }catch(error){
            next(error)
            console.log(error)
        }
    }
    static async getBalance(req:Request,res:Response,next:NextFunction){
        try{
            const {accountId}=req.params;

            const balance=await AccountService.getBalanceById(accountId)

            res.status(201).json(new ApiResponse(true,"Amount Fetched successfuly",balance))
        }catch(error){
            next(error)
        }
    }

    static async getAllAccounts(req:Request,res:Response,next:NextFunction){
        try{
            const userId=(req as any).user.id

            const accounts=await AccountService.getAllAccounts(userId)

            res.status(201).json(new ApiResponse(true,"Accounts Feteched successfuly",accounts))
        }catch(error){
            next(error)
        }
    }
}