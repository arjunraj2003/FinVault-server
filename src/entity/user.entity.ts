import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany
} from "typeorm";
import { Account } from "./account.entity";
import { Budget } from "./budget.entity";
import { Transaction } from "./transaction.entity";
import { TransactionCategory } from "./TransactionCategory.entity";
import { CreditCardDetails } from "./CreditCardDetails.entity";
import { CreditCardStatement } from "./CreditCardStatement.entity";
import { WebAuthnCredential } from "./webauthn-credential.entity";
import { PushSubscription } from "./push-subscription.entity";
import { NotificationLog } from "./notification-log.entity";
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

    @OneToMany(() => Transaction, (transaction) => transaction.user)
    transactions!: Transaction[];

    @OneToMany(() => TransactionCategory, (category) => category.user)
    categories!: TransactionCategory[];

    @OneToMany(() => CreditCardDetails, (details) => details.user)
    creditCards!: CreditCardDetails[];

    @OneToMany(() => CreditCardStatement, (statement) => statement.user)
    creditCardStatements!: CreditCardStatement[];

    @Exclude()
    @OneToMany(() => WebAuthnCredential, (credential) => credential.user)
    webauthnCredentials!: WebAuthnCredential[];

    @Exclude()
    @OneToMany(() => PushSubscription, (subscription) => subscription.user)
    pushSubscriptions!: PushSubscription[];

    @Exclude()
    @OneToMany(() => NotificationLog, (entry) => entry.user)
    notificationLogs!: NotificationLog[];
}
