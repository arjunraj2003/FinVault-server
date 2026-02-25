import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import { Account } from "./Account.entity";

export enum TransactionCategory {
    FOOD = "food",
    RENT = "rent",
    SALARY = "salary",
    TRANSPORT = "transport",
    SHOPPING = "shopping",
    UTILITIES = "utilities",
    ENTERTAINMENT = "entertainment",
    INVESTMENT = "investment",
    HEALTH ="health",
    OTHER = "other",
}


export enum TransactionType {
    CREDIT = "credit",
    DEBIT = "debit"
}

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "enum", enum: TransactionType })
    type!: TransactionType;

    @Column({ type: "decimal", precision: 12, scale: 2 })
    amount!: string; // decimal values return as strings

    @Column({ type: 'enum', enum: TransactionCategory })
    category!: TransactionCategory;

    @Column({ nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @Column({ type: "date" })
    transactionDate!: Date;

    @ManyToOne(() => Account, (account) => account.transactions, {
        onDelete: "CASCADE"
    })
    account!: Account;
}
