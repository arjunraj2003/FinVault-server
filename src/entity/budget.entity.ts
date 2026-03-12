import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import { User } from "./user.entity";
import { TransactionCategory } from "../utils/transaction-category.enum";

@Entity()
export class Budget {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "decimal", precision: 12, scale: 2 })
    amount!: string;

    @Column({ type: "enum", enum: TransactionCategory })
    category!: TransactionCategory;

    @Column({ type: "date" })
    startDate!: Date;

    @Column({ type: "date" })
    endDate!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @ManyToOne(() => User, (user) => user.budgets, {
        onDelete: "CASCADE"
    })
    user!: User;
}
