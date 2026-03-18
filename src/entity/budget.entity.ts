import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import { User } from "./user.entity";
import { TransactionCategory } from "./TransactionCategory.entity";


@Entity()
export class Budget {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "decimal", precision: 12, scale: 2 })
    amount!: string;

    @ManyToOne(() => TransactionCategory, { eager: false, nullable: false })
    @JoinColumn({ name: "category_id" })
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
