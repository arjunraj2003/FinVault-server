import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { User } from "../entity/user.entity";
import { Account } from "../entity/account.entity";
import { Transaction } from "../entity/transaction.entity";
import { Budget } from "../entity/budget.entity";
import { TransactionCategory } from "../entity/TransactionCategory.entity";
import { CreditCardDetails } from "../entity/CreditCardDetails.entity";
import { CreditCardStatement } from "../entity/CreditCardStatement.entity";
import { WebAuthnCredential } from "../entity/webauthn-credential.entity";
import { PushSubscription } from "../entity/push-subscription.entity";
import { NotificationLog } from "../entity/notification-log.entity";

dotenv.config();

const AI_ROLE = "finvault_ai";

const TABLE_CANDIDATES = {
    user: ["user", "User"],
    account: ["account", "Account"],
    transaction: ["transaction", "Transaction"],
    category: ["transaction_category", "TransactionCategory"],
    budget: ["budget", "Budget"],
    creditCardDetails: ["CreditCardDetails", "credit_card_details"],
    creditCardStatement: ["CreditCardStatement", "credit_card_statement"],
} as const;

type TableKey = keyof typeof TABLE_CANDIDATES;

const TABLES_NEEDING_USER_COLUMN: TableKey[] = [
    "transaction",
    "category",
    "creditCardDetails",
    "creditCardStatement",
];

const TABLES_FILLED_FROM_ACCOUNT: TableKey[] = [
    "transaction",
    "creditCardDetails",
    "creditCardStatement",
];

const TABLES_ASSIGNED_TO_SINGLE_USER: TableKey[] = [
    "account",
    "budget",
    "category",
    "transaction",
    "creditCardDetails",
    "creditCardStatement",
];

function quoteIdent(name: string): string {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
        throw new Error(`Refusing to quote identifier "${name}"`);
    }
    return `"${name}"`;
}

function rawDataSource() {
    return new DataSource({
        type: "postgres",
        url: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        synchronize: false,
        entities: [],
    });
}

async function resolveTable(ds: DataSource, candidates: readonly string[]): Promise<string | null> {
    const rows: { table_name: string }[] = await ds.query(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = ANY($1)
         LIMIT 1`,
        [candidates]
    );
    return rows[0]?.table_name ?? null;
}

async function hasColumn(ds: DataSource, table: string, column: string): Promise<boolean> {
    const rows: unknown[] = await ds.query(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
        [table, column]
    );
    return rows.length > 0;
}

async function countMissingOwners(ds: DataSource, table: string): Promise<number> {
    const rows: { count: string }[] = await ds.query(
        `SELECT COUNT(*)::int AS count FROM ${quoteIdent(table)} WHERE "userId" IS NULL`
    );
    return Number(rows[0]?.count ?? 0);
}

async function dropSingleColumnUniqueOnName(ds: DataSource, table: string) {
    const constraints: { conname: string }[] = await ds.query(
        `SELECT c.conname
         FROM pg_constraint c
         JOIN pg_class rel ON rel.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = rel.relnamespace
         JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
         WHERE n.nspname = 'public'
           AND rel.relname = $1
           AND c.contype = 'u'
           AND array_length(c.conkey, 1) = 1
           AND a.attname = 'name'`,
        [table]
    );

    for (const constraint of constraints) {
        await ds.query(
            `ALTER TABLE ${quoteIdent(table)} DROP CONSTRAINT ${quoteIdent(constraint.conname)}`
        );
    }
}

/**
 * Adds owner columns and attaches existing rows before TypeORM synchronize
 * marks userId NOT NULL. A single existing user inherits orphan rows.
 * Several users with unowned rows stop startup instead of guessing.
 */
export async function prepareOwnership() {
    const ds = rawDataSource();
    await ds.initialize();

    try {
        const tables = {} as Record<TableKey, string | null>;
        for (const key of Object.keys(TABLE_CANDIDATES) as TableKey[]) {
            tables[key] = await resolveTable(ds, TABLE_CANDIDATES[key]);
        }

        if (!tables.user) {
            return;
        }

        for (const key of TABLES_NEEDING_USER_COLUMN) {
            const table = tables[key];
            if (!table) continue;
            if (!(await hasColumn(ds, table, "userId"))) {
                await ds.query(`ALTER TABLE ${quoteIdent(table)} ADD COLUMN "userId" uuid`);
            }
        }

        const account = tables.account;
        if (account && (await hasColumn(ds, account, "userId"))) {
            for (const key of TABLES_FILLED_FROM_ACCOUNT) {
                const table = tables[key];
                if (!table || !(await hasColumn(ds, table, "userId"))) continue;
                if (!(await hasColumn(ds, table, "accountId"))) continue;
                await ds.query(
                    `UPDATE ${quoteIdent(table)} AS child
                     SET "userId" = account."userId"
                     FROM ${quoteIdent(account)} AS account
                     WHERE child."accountId" = account.id
                       AND child."userId" IS NULL
                       AND account."userId" IS NOT NULL`
                );
            }
        }

        const users: { id: string }[] = await ds.query(
            `SELECT id FROM ${quoteIdent(tables.user)} LIMIT 2`
        );

        const orphans: { table: string; count: number }[] = [];
        for (const key of TABLES_ASSIGNED_TO_SINGLE_USER) {
            const table = tables[key];
            if (!table || !(await hasColumn(ds, table, "userId"))) continue;
            const count = await countMissingOwners(ds, table);
            if (count > 0) orphans.push({ table, count });
        }

        if (orphans.length > 0) {
            if (users.length !== 1) {
                const detail = orphans.map((row) => `${row.table}: ${row.count}`).join(", ");
                const reason = users.length === 0 ? "no users exist" : "more than one user exists";
                throw new Error(
                    `Cannot assign existing rows to a user because ${reason} and some rows have no owner (${detail}). Assign "userId" manually before starting the server.`
                );
            }

            for (const orphan of orphans) {
                await ds.query(
                    `UPDATE ${quoteIdent(orphan.table)} SET "userId" = $1 WHERE "userId" IS NULL`,
                    [users[0].id]
                );
            }
        }

        for (const key of TABLES_ASSIGNED_TO_SINGLE_USER) {
            const table = tables[key];
            if (!table || !(await hasColumn(ds, table, "userId"))) continue;
            const remaining = await countMissingOwners(ds, table);
            if (remaining > 0) {
                throw new Error(
                    `Cannot start because ${remaining} rows in ${table} still have no owner.`
                );
            }
            await ds.query(
                `ALTER TABLE ${quoteIdent(table)} ALTER COLUMN "userId" SET NOT NULL`
            );
        }

        if (tables.category) {
            await dropSingleColumnUniqueOnName(ds, tables.category);
        }
    } finally {
        await ds.destroy();
    }
}

export async function ensureRowLevelSecurity() {
    const existing: unknown[] = await AppDataSource.query(
        `SELECT 1 FROM pg_roles WHERE rolname = $1`,
        [AI_ROLE]
    );
    if (existing.length === 0) {
        await AppDataSource.query(`CREATE ROLE ${AI_ROLE} NOLOGIN`);
    }

    await AppDataSource.query(`GRANT ${AI_ROLE} TO CURRENT_USER`);
    await AppDataSource.query(`GRANT USAGE ON SCHEMA public TO ${AI_ROLE}`);

    const entities = [
        User,
        Account,
        Transaction,
        Budget,
        TransactionCategory,
        CreditCardDetails,
        CreditCardStatement,
        WebAuthnCredential,
        PushSubscription,
        NotificationLog,
    ];

    for (const entity of entities) {
        const meta = AppDataSource.getMetadata(entity);
        const table = quoteIdent(meta.tableName);
        const isUserTable = meta.target === User;
        const ownerColumn = isUserTable
            ? meta.primaryColumns[0]?.databaseName
            : meta.findColumnWithPropertyName("userId")?.databaseName
                ?? meta.relations.find((relation) => relation.propertyName === "user")?.joinColumns[0]?.databaseName;

        if (!ownerColumn) {
            throw new Error(`No owner column found for ${meta.tableName}`);
        }

        await AppDataSource.query(`REVOKE ALL ON TABLE ${table} FROM ${AI_ROLE}`);

        if (isUserTable) {
            const columns = meta.columns
                .filter((column) => column.propertyName !== "password")
                .map((column) => quoteIdent(column.databaseName))
                .join(", ");
            await AppDataSource.query(`GRANT SELECT (${columns}) ON ${table} TO ${AI_ROLE}`);
        } else {
            await AppDataSource.query(`GRANT SELECT ON ${table} TO ${AI_ROLE}`);
        }

        await AppDataSource.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
        await AppDataSource.query(`DROP POLICY IF EXISTS finvault_ai_select ON ${table}`);
        await AppDataSource.query(
            `CREATE POLICY finvault_ai_select ON ${table}
             FOR SELECT
             TO ${AI_ROLE}
             USING (${quoteIdent(ownerColumn)} = NULLIF(current_setting('app.user_id', true), '')::uuid)`
        );
    }
}
