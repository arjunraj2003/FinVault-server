"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionCategory = void 0;
const typeorm_1 = require("typeorm");
const transaction_entity_1 = require("./transaction.entity");
const budget_entity_1 = require("./budget.entity"); // ✅ add
let TransactionCategory = class TransactionCategory {
};
exports.TransactionCategory = TransactionCategory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TransactionCategory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], TransactionCategory.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TransactionCategory.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TransactionCategory.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => transaction_entity_1.Transaction, (transaction) => transaction.category),
    __metadata("design:type", Array)
], TransactionCategory.prototype, "transactions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => budget_entity_1.Budget, (budget) => budget.category),
    __metadata("design:type", Array)
], TransactionCategory.prototype, "budgets", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TransactionCategory.prototype, "createdAt", void 0);
exports.TransactionCategory = TransactionCategory = __decorate([
    (0, typeorm_1.Entity)("transaction_category")
], TransactionCategory);
//# sourceMappingURL=TransactionCategory.entity.js.map