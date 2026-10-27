import { AppDataSource } from "./data-source";
import { NotificationLog } from "../entity/notification-log.entity";
import { PushSubscription } from "../entity/push-subscription.entity";
import { User } from "../entity/user.entity";

function quoteIdent(name: string) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
        throw new Error(`Refusing to quote identifier "${name}"`);
    }
    return `"${name}"`;
}

export async function ensureNotificationTables() {
    const userTable = quoteIdent(AppDataSource.getMetadata(User).tableName);
    const pushTable = quoteIdent(AppDataSource.getMetadata(PushSubscription).tableName);
    const logTable = quoteIdent(AppDataSource.getMetadata(NotificationLog).tableName);

    await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS ${pushTable} (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            endpoint text NOT NULL UNIQUE,
            "p256dh" text NOT NULL,
            auth text NOT NULL,
            "userId" uuid NOT NULL REFERENCES ${userTable}(id) ON DELETE CASCADE,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now()
        )
    `);

    await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS ${logTable} (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "userId" uuid NOT NULL REFERENCES ${userTable}(id) ON DELETE CASCADE,
            kind character varying NOT NULL,
            "subjectId" character varying NOT NULL,
            threshold integer NOT NULL,
            "periodKey" character varying NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            UNIQUE ("userId", kind, "subjectId", threshold, "periodKey")
        )
    `);
}
