import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Account } from "./account.entity";
import { User } from "./user.entity";

@Entity()
export class CreditCardDetails {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "accountId" })
  accountId!: string;

  @OneToOne(() => Account, (account) => account.creditCardDetails, { onDelete: "CASCADE" })
  @JoinColumn({ name: "accountId" })
  account!: Account;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  creditLimit!: string;

  @Column({ type: "int" })
  statementDay!: number;

  @Column({ type: "int" })
  dueDay!: number;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  interestRate?: string;

  @Column({ type: "uuid", name: "userId" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.creditCards, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "userId" })
  user!: User;
}
