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
exports.Account = exports.AccountType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const transaction_entity_1 = require("./transaction.entity");
var AccountType;
(function (AccountType) {
    AccountType["CHECKING"] = "checking";
    AccountType["SAVINGS"] = "savings";
    AccountType["CREDIT"] = "credit";
    AccountType["INVESTMENT"] = "investment";
})(AccountType || (exports.AccountType = AccountType = {}));
let Account = class Account {
};
exports.Account = Account;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Account.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Account.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'enum', enum: AccountType }),
    __metadata("design:type", String)
], Account.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", String)
], Account.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Account.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.accounts, { onDelete: "CASCADE" }),
    __metadata("design:type", user_entity_1.User)
], Account.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => transaction_entity_1.Transaction, (transaction) => transaction.account, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Account.prototype, "transactions", void 0);
exports.Account = Account = __decorate([
    (0, typeorm_1.Entity)()
], Account);
//# sourceMappingURL=account.entity.js.map