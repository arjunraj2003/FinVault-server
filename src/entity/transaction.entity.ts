import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import { Account } from "./account.entity";
import { TransactionType } from "../utils/transaction-category.enum";
import { TransactionCategory } from "./TransactionCategory.entity";



@Entity()
export class Transaction {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "enum", enum: TransactionType })
    type!: TransactionType;

    @Column({ type: "decimal", precision: 12, scale: 2 })
    amount!: string; // decimal values return as strings

    @ManyToOne(() => TransactionCategory, { eager: false, nullable: false })
    @JoinColumn({ name: 'category_id' })
    category!: TransactionCategory;

    @Column({ nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @Column({ type: "date" })
    transactionDate!: Date;

    @Column({ name: "accountId" })
    accountId!: string;  // ✅ exposes the FK column directly — no cast needed

    @ManyToOne(() => Account, (account) => account.transactions, {
        onDelete: "CASCADE"
    })
    account!: Account;
}
