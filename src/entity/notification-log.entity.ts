import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import { User } from "./user.entity";

@Entity("notification_log")
@Unique(["userId", "kind", "subjectId", "threshold", "periodKey"])
export class NotificationLog {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid", name: "userId" })
    userId!: string;

    @Column()
    kind!: string;

    @Column()
    subjectId!: string;

    @Column({ type: "int" })
    threshold!: number;

    @Column()
    periodKey!: string;

    @ManyToOne(() => User, (user) => user.notificationLogs, { onDelete: "CASCADE", nullable: false })
    @JoinColumn({ name: "userId" })
    user!: User;

    @CreateDateColumn()
    createdAt!: Date;
}
