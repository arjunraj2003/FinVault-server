import axios, { AxiosError } from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 120_000, // local LLMs are slow
  headers: { 'Content-Type': 'application/json' },
});

// ✅ Update interface to include explanation for non-finance intents
export interface AIQueryPass1Response {
  sql: string | null;        // ✅ can be null for greetings
  rag_context: string;
  explanation?: string;      // ✅ present when intent is not finance
  intent?: string;           // ✅ optional intent field
}

export interface AIQueryPass2Response {
  explanation: string;
}

/**
 * Pass 1 — send the question, get back generated SQL + RAG context.
 */
export async function generateSQL(
  question: string,
  userId: string
): Promise<AIQueryPass1Response> {
  const { data } = await aiClient.post<AIQueryPass1Response>('/query', {
    question,
    user_id: userId,
    db_results: [],
  });
  return data;
}

/**
 * Pass 2 — send the DB results, get back a natural language explanation.
 */
export async function generateExplanation(
  question: string,
  userId: string,
  dbResults: Record<string, unknown>[],
  ragContext: string,
  sqlError?: string
): Promise<AIQueryPass2Response> {
  const { data } = await aiClient.post<AIQueryPass2Response>('/query', {
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
export function isAIServiceUnavailable(err: unknown): boolean {
  return (
    err instanceof AxiosError &&
    (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED')
  );
}