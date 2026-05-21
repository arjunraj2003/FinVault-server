import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Account } from "./account.entity";

@Entity()
export class CreditCardStatement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "accountId" })
  accountId!: string;

  @ManyToOne(() => Account, { onDelete: "CASCADE" })
  @JoinColumn({ name: "accountId" })
  account!: Account;

  @Column({ type: "date" })
  statementDate!: Date;

  @Column({ type: "date" })
  dueDate!: Date;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  statementBalance!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  minimumPayment!: string;

  @Column({ type: "boolean", default: false })
  isPaid!: boolean;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  amountPaid!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
