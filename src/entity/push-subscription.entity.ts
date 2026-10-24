import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("push_subscription")
export class PushSubscription {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true, type: "text" })
    endpoint!: string;

    @Column({ type: "text" })
    p256dh!: string;

    @Column({ type: "text" })
    auth!: string;

    @Column({ type: "uuid", name: "userId" })
    userId!: string;

    @ManyToOne(() => User, (user) => user.pushSubscriptions, { onDelete: "CASCADE", nullable: false })
    @JoinColumn({ name: "userId" })
    user!: User;

    @CreateDateColumn()
    createdAt!: Date;
}
