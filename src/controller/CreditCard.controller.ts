import { NextFunction, Request, Response } from "express";
import { CreditCardService } from "../service/CreditCard.service";
import { ApiResponse } from "../utils/apiResponse";

export class CreditCardController {
    static async getSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const { accountId } = req.params;
            const userId = (req as any).user.id;
            
            const summary = await CreditCardService.getCreditCardSummary(accountId, userId);
            
            res.status(200).json(new ApiResponse(true, "Credit Card summary fetched successfully", summary));
        } catch (error) {
            next(error);
        }
    }
}
