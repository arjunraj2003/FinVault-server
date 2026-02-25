import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn
} from "typeorm";
import { User } from "./User.entity";
import { Transaction } from "./Transaction.entity";

export enum AccountType {
  CHECKING = "checking",
  SAVINGS = "savings",
  CREDIT = "credit",
  INVESTMENT = "investment",
}
@Entity()
export class Account {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!: string;

    @Column({nullable:true,type:'enum',enum:AccountType})
    type!: AccountType;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    balance!: string;  // if you're storing balance

    @CreateDateColumn()
    createdAt!: Date;

    @ManyToOne(() => User, (user) => user.accounts, { onDelete: "CASCADE" })
    user!: User;

    @OneToMany(() => Transaction, (transaction) => transaction.account, {
        cascade: true,
    })
    transactions!: Transaction[];
}
