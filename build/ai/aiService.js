"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSQL = generateSQL;
exports.generateExplanation = generateExplanation;
exports.isAIServiceUnavailable = isAIServiceUnavailable;
const axios_1 = __importStar(require("axios"));
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const aiClient = axios_1.default.create({
    baseURL: AI_SERVICE_URL,
    timeout: 120_000, // local LLMs are slow
    headers: { 'Content-Type': 'application/json' },
});
/**
 * Pass 1 — send the question, get back generated SQL + RAG context.
 */
async function generateSQL(question, userId) {
    const { data } = await aiClient.post('/query', {
        question,
        user_id: userId,
        db_results: [],
    });
    return data;
}
/**
 * Pass 2 — send the DB results, get back a natural language explanation.
 */
async function generateExplanation(question, userId, dbResults, ragContext, sqlError) {
    const { data } = await aiClient.post('/query', {
        question,
        user_id: userId,
        db_results: dbResults,
        rag_context: ragContext,
        sql_error: sqlError ?? null,
    });
    return data;
}
/**
 * Friendly error message for connection failures.
 */
function isAIServiceUnavailable(err) {
    return (err instanceof axios_1.AxiosError &&
        (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED'));
}
//# sourceMappingURL=aiService.js.map