import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany
} from "typeorm";
import { Account } from "./account.entity";
import { Budget } from "./budget.entity";
import { Exclude } from "class-transformer";


@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!: string;

    @Column({ unique: true })
    email!: string;

    @Exclude()
    @Column()
    password!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @OneToMany(() => Account, (account) => account.user, { cascade: true })
    accounts!: Account[];

    @OneToMany(() => Budget, (budget) => budget.user, { cascade: true })
    budgets!: Budget[];
}
