"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBudgetSchema = exports.createBudgetSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createBudgetSchema = joi_1.default.object({
    amount: joi_1.default.number().positive().required(),
    categoryId: joi_1.default.string().required(),
    startDate: joi_1.default.date().iso().required(),
    endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).required()
});
exports.updateBudgetSchema = joi_1.default.object({
    amount: joi_1.default.number().positive().optional(),
    categoryId: joi_1.default.string().optional(),
    startDate: joi_1.default.date().iso().optional(),
    endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional()
});
//# sourceMappingURL=budgetValidator.js.map