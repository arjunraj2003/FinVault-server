"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const user_entity_1 = require("../entity/user.entity");
const account_entity_1 = require("../entity/account.entity");
const transaction_entity_1 = require("../entity/transaction.entity");
const budget_entity_1 = require("../entity/budget.entity");
const TransactionCategory_entity_1 = require("../entity/TransactionCategory.entity");
dotenv_1.default.config();
// export const AppDataSource = new DataSource({
//     type: "postgres",
//     host: process.env.DB_HOST,
//     port: parseInt(process.env.DB_PORT || "5432"),
//     username: process.env.DB_USERNAME,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     synchronize: true,
//     logging: false,
//     entities: [User,Account,Transaction,Budget,TransactionCategory],
// })
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    synchronize: process.env.NODE_ENV !== "production",
    logging: false,
    entities: [user_entity_1.User, account_entity_1.Account, transaction_entity_1.Transaction, budget_entity_1.Budget, TransactionCategory_entity_1.TransactionCategory],
});
//# sourceMappingURL=data-source.js.map