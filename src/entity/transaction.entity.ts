import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import { Account } from "./account.entity";
import { TransactionCategory, TransactionType } from "../utils/transaction-category.enum";


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
