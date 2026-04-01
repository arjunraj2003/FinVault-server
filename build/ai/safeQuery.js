"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeAIQuery = safeAIQuery;
const BLOCKED = /\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/i;
/**
 * Execute a raw SQL string produced by the AI service.
 *
 * Reuses your existing AppDataSource — no second DB connection opened.
 * Only SELECT and WITH (CTEs) statements are permitted.
 */
async function safeAIQuery(dataSource, rawSql) {
    const trimmed = rawSql.trim();
    const upper = trimmed.toUpperCase();
    if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
        throw new Error("AI query rejected: only SELECT / WITH statements are permitted.");
    }
    if (BLOCKED.test(trimmed)) {
        throw new Error("AI query rejected: contains disallowed mutation keyword.");
    }
    const rows = await dataSource.query(trimmed);
    return rows;
}
//# sourceMappingURL=safeQuery.js.map