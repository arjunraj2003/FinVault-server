import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entity/user.entity";
import { Account } from "../entity/account.entity";
import { Transaction } from "../entity/transaction.entity";
import { Budget } from "../entity/budget.entity";
dotenv.config();




// export const AppDataSource = new DataSource({
//     type: "postgres",
//     host: process.env.DB_HOST,
//     port: parseInt(process.env.DB_PORT || "5432"),
//     username: process.env.DB_USERNAME,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     synchronize: true,
//     logging: false,

//     entities: [User,Account,Transaction,Budget],
// });


export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  synchronize: true,
  logging: false,
  entities: [__dirname + "/../entity/*.js"],
});
