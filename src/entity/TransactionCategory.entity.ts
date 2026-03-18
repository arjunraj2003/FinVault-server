import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Transaction } from "./transaction.entity";
import { Budget } from "./budget.entity"; // ✅ add

@Entity("transaction_category")
export class TransactionCategory {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    name!: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ default: true })
    isActive!: boolean;

    @OneToMany(() => Transaction, (transaction) => transaction.category)
    transactions!: Transaction[];  // ✅ renamed to plural (transactions)

    @OneToMany(() => Budget, (budget) => budget.category)
    budgets!: Budget[];            // ✅ add — Budget also has ManyToOne to this entity

    @CreateDateColumn()
    createdAt!: Date;
}