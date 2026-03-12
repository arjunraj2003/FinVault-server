"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const User_entity_1 = require("../entity/User.entity");
const Account_entity_1 = require("../entity/Account.entity");
const Transaction_entity_1 = require("../entity/Transaction.entity");
const Budget_entity_1 = require("../entity/Budget.entity");
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [User_entity_1.User, Account_entity_1.Account, Transaction_entity_1.Transaction, Budget_entity_1.Budget],
});
// export const AppDataSource = new DataSource({
//   type: "postgres",
//   url: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false,
//   },
//   synchronize: false,
//   logging: false,
//   entities: [User, Account, Transaction, Budget],
//   migrations: ["dist/migrations/*.js"],
// });
//# sourceMappingURL=data-source.js.map