import Joi from "joi";
import { TransactionCategory } from "../transaction-category.enum";

export const createBudgetSchema = Joi.object({
    amount: Joi.number().positive().required(),
    categoryId: Joi.string().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
});

export const updateBudgetSchema = Joi.object({
    amount: Joi.number().positive().optional(),
    categoryId: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
});
