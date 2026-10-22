import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("webauthn_credential")
export class WebAuthnCredential {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    credentialId!: string;

    @Column({ type: "text" })
    publicKey!: string;

    @Column({ type: "int", default: 0 })
    counter!: number;

    @Column({ type: "simple-array", nullable: true })
    transports?: string[];

    @Column({ nullable: true })
    label?: string;

    @Column({ type: "uuid", name: "userId" })
    userId!: string;

    @ManyToOne(() => User, (user) => user.webauthnCredentials, { onDelete: "CASCADE", nullable: false })
    @JoinColumn({ name: "userId" })
    user!: User;

    @CreateDateColumn()
    createdAt!: Date;
}
