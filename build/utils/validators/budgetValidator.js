"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBudgetSchema = exports.createBudgetSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const Transaction_entity_1 = require("../../entity/Transaction.entity");
exports.createBudgetSchema = joi_1.default.object({
    amount: joi_1.default.number().positive().required(),
    category: joi_1.default.string().valid(...Object.values(Transaction_entity_1.TransactionCategory)).required(),
    startDate: joi_1.default.date().iso().required(),
    endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).required()
});
exports.updateBudgetSchema = joi_1.default.object({
    amount: joi_1.default.number().positive().optional(),
    category: joi_1.default.string().valid(...Object.values(Transaction_entity_1.TransactionCategory)).optional(),
    startDate: joi_1.default.date().iso().optional(),
    endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional()
});
//# sourceMappingURL=budgetValidator.js.map