import { DataSource } from "typeorm";

const BLOCKED = /\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/i;

/**
 * Execute a raw SQL string produced by the AI service.
 *
 * Reuses your existing AppDataSource — no second DB connection opened.
 * Only SELECT and WITH (CTEs) statements are permitted.
 */
const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function safeAIQuery(
    dataSource: DataSource,
    rawSql: string,
    userId: string
): Promise<Record<string, unknown>[]> {
    const trimmed = rawSql.trim().replace(/;+\s*$/, "");
    const upper = trimmed.toUpperCase();

    if (!USER_ID.test(userId)) {
        throw new Error("AI query rejected: caller is not an authenticated user.");
    }

    if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
        throw new Error("AI query rejected: only SELECT / WITH statements are permitted.");
    }

    if (trimmed.includes(";")) {
        throw new Error("AI query rejected: multiple statements are not permitted.");
    }

    if (BLOCKED.test(trimmed)) {
        throw new Error("AI query rejected: contains disallowed mutation keyword.");
    }

    return dataSource.transaction(async (manager) => {
        await manager.query(`SELECT set_config('app.user_id', $1, true)`, [userId]);
        await manager.query(`SET LOCAL ROLE finvault_ai`);
        const rows = await manager.query(trimmed);
        return rows as Record<string, unknown>[];
    });
}