import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { ApiResponse } from "../utils/apiResponse";
import { generateSQL, generateExplanation, isAIServiceUnavailable } from "./aiService";
import { safeAIQuery } from "./safeQuery";
import Fuse from "fuse.js";

// ── Category aliases map ───────────────────────────────────────
const CATEGORY_ALIASES: Record<string, string> = {
    'food': 'food', 'grocery': 'food', 'groceries': 'food',
    'restaurant': 'food', 'eating': 'food', 'meal': 'food',
    'breakfast': 'food', 'lunch': 'food', 'dinner': 'food',
    'cafe': 'food', 'coffee': 'food', 'snack': 'food',
    'transport': 'transport', 'train': 'transport', 'bus': 'transport',
    'metro': 'transport', 'uber': 'transport', 'cab': 'transport',
    'taxi': 'transport', 'fuel': 'transport', 'petrol': 'transport',
    'ticket': 'transport', 'commute': 'transport', 'flight': 'transport',
    'auto': 'transport', 'rickshaw': 'transport',
    'shopping': 'shopping', 'clothes': 'shopping', 'clothing': 'shopping',
    'amazon': 'shopping', 'purchase': 'shopping', 'shoes': 'shopping',
    'flipkart': 'shopping', 'online': 'shopping',
    'entertainment': 'entertainment', 'movie': 'entertainment',
    'netflix': 'entertainment', 'spotify': 'entertainment',
    'game': 'entertainment', 'concert': 'entertainment',
    'subscription': 'entertainment', 'ott': 'entertainment',
    'utilities': 'utilities', 'electricity': 'utilities',
    'internet': 'utilities', 'wifi': 'utilities', 'bill': 'utilities',
    'mobile': 'utilities', 'phone': 'utilities', 'recharge': 'utilities',
    'water': 'utilities',
    'health': 'health', 'medicine': 'health', 'doctor': 'health',
    'hospital': 'health', 'pharmacy': 'health', 'gym': 'health',
    'fitness': 'health', 'medical': 'health',
    'rent': 'rent', 'house': 'rent', 'apartment': 'rent', 'lease': 'rent',
    'pg': 'rent', 'hostel': 'rent',
    'investment': 'investment', 'stock': 'investment', 'sip': 'investment',
    'crypto': 'investment', 'mutual': 'investment', 'share': 'investment',
    'salary': 'salary', 'income': 'salary', 'bonus': 'salary', 'paycheck': 'salary',
    'other': 'other', 'misc': 'other', 'miscellaneous': 'other',
};

// ── Fuzzy category detector ────────────────────────────────────
function detectCategory(question: string): string | undefined {
    const words = question.toLowerCase().split(/\s+/);
    const aliasKeys = Object.keys(CATEGORY_ALIASES);

    const IGNORE_WORDS = new Set([
        'this', 'that', 'the', 'my', 'on', 'in', 'at', 'by', 'of',
        'for', 'how', 'much', 'did', 'i', 'spend', 'spending', 'spent',
        'total', 'month', 'week', 'year', 'today', 'show', 'what',
        'are', 'is', 'was', 'all', 'give', 'me', 'can', 'you', 'do',
        'get', 'list', 'find', 'transactions', 'transaction', 'expenses',
        'expense', 'budget', 'budgets', 'summary', 'report', 'last',
        'current', 'previous', 'recent', 'top', 'much', 'many'
    ]);


    const TOTAL_KEYWORDS = ['total', 'overall', 'all categories', 'everything', 'summary'];
    if (TOTAL_KEYWORDS.some(kw => question.toLowerCase().includes(kw))) {
        console.log("Total spending question detected — skipping category detection");
        return undefined;
    }
    // Step 1 — exact word match
   for (const word of words) {
        if (IGNORE_WORDS.has(word)) continue;
        if (CATEGORY_ALIASES[word]) {
            console.log(`Exact match: "${word}" → ${CATEGORY_ALIASES[word]}`);
            return CATEGORY_ALIASES[word];
        }
    }

    // Step 2 — fuzzy match
    const fuse = new Fuse(aliasKeys, {
        threshold: 0.2,
        minMatchCharLength: 4,
    });

     for (const word of words) {
        if (IGNORE_WORDS.has(word)) continue;
        if (word.length < 4) continue;
        const results = fuse.search(word);
        if (results.length > 0) {
            const matched = results[0].item;
            const category = CATEGORY_ALIASES[matched];
            console.log(`Fuzzy match: "${word}" → "${matched}" → ${category}`);
            return category;
        }
    }

    return undefined;
}

export class ChatController {
    static async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { question } = req.body;
            const userId = (req as any).user.userId;

            if (!question || typeof question !== "string" || !question.trim()) {
                res.status(400).json(new ApiResponse(false, "question is required.", null));
                return;
            }

            // ── Pass 1: Generate SQL ───────────────────────────────────────
            const pass1 = await generateSQL(question.trim(), userId);

            // ✅ If AI service handled it directly (greeting/unknown intent)
            // sql will be null and explanation will be present
            if (!pass1.sql && pass1.explanation) {
                res.status(200).json(new ApiResponse(true, "Chat response generated successfully", {
                    question,
                    sql: null,
                    results: [],
                    explanation: pass1.explanation,
                }));
                return;
            }

            // ── Detect category from question ──────────────────────────────
            const mentionedCategory = detectCategory(question);

            console.log(mentionedCategory,"---cate--->")

            // ── Execute SQL ────────────────────────────────────────────────
            let results: Record<string, unknown>[] = [];
            let sqlError: string | undefined;

            try {
                results = await safeAIQuery(AppDataSource, pass1.sql);
            } catch (err) {
                sqlError = (err as Error).message;
            }

            // ── Fetch budget context only if category detected ─────────────
            let budgetContext: Record<string, unknown>[] = [];
            if (mentionedCategory) {
                try {
                    budgetContext = await AppDataSource.query(`
                        SELECT
                            tc.name AS category,
                            b.amount AS budget_limit,
                            b."startDate",
                            b."endDate",
                            COALESCE(SUM(t.amount), 0) AS total_spent,
                            b.amount - COALESCE(SUM(t.amount), 0) AS remaining
                        FROM budget b
                        JOIN transaction_category tc ON tc.id = b.category_id
                        LEFT JOIN account a ON a."userId" = b."userId"
                        LEFT JOIN transaction t
                            ON t."accountId" = a.id
                            AND t.type = 'debit'
                            AND t.category_id = b.category_id
                            AND t."transactionDate" BETWEEN b."startDate" AND b."endDate"
                        WHERE b."userId" = $1
                          AND LOWER(tc.name) = $2
                          AND CURRENT_DATE BETWEEN b."startDate" AND b."endDate"
                        GROUP BY b.id, tc.name, b.amount, b."startDate", b."endDate"
                    `, [userId, mentionedCategory]);
                } catch (err) {
                    console.log("Budget context fetch skipped:", (err as Error).message);
                }
            }

            // ── Enrich results with budget context ─────────────────────────
            const enrichedResults = [
                ...results,
                ...(budgetContext.length > 0 ? budgetContext.map((b: any) => ({
                    budget_category: b.category,
                    budget_limit: b.budget_limit,
                    budget_spent: b.total_spent,
                    budget_remaining: b.remaining,
                })) : []),
            ];

            // ── Pass 2: Generate explanation ───────────────────────────────
            const { explanation } = await generateExplanation(
                question.trim(),
                userId,
                enrichedResults,
                pass1.rag_context,
                sqlError
            );

            res.status(200).json(new ApiResponse(true, "Chat response generated successfully", {
                question,
                sql: pass1.sql,
                results,
                explanation,
                ...(sqlError && { sqlError }),
            }));

        } catch (err) {
            if (isAIServiceUnavailable(err)) {
                res.status(503).json(new ApiResponse(false, "AI service is offline.", null));
                return;
            }
            next(err);
        }
    }
}