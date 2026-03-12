import Joi from "joi";
import { TransactionCategory } from "../../entity/Transaction.entity";

export const createBudgetSchema = Joi.object({
    amount: Joi.number().positive().required(),
    category: Joi.string().valid(...Object.values(TransactionCategory)).required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
});

export const updateBudgetSchema = Joi.object({
    amount: Joi.number().positive().optional(),
    category: Joi.string().valid(...Object.values(TransactionCategory)).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
});
