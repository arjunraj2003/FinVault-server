import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Transaction } from "./transaction.entity";
import { Budget } from "./budget.entity";
import { User } from "./user.entity";

@Entity("transaction_category")
@Unique(["user", "name"])
export class TransactionCategory {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!: string;

    @Column({ type: "uuid", name: "userId" })
    userId!: string;

    @ManyToOne(() => User, (user) => user.categories, { onDelete: "CASCADE", nullable: false })
    @JoinColumn({ name: "userId" })
    user!: User;

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