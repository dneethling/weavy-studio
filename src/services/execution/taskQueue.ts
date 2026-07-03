/**
 * Global throttled task queue for AI API calls.
 *
 * All Gemini/Imagen/Veo requests are funneled through this queue so that a
 * large batch run (e.g. 5 prompts x 4 variations) never fires more than
 * `concurrency` requests at once, and transient failures (429 rate limits,
 * 5xx overload) are retried with exponential backoff + jitter instead of
 * failing the whole run.
 */

import { DEFAULT_CONCURRENCY } from '../../constants/defaults';

export class CancelledError extends Error {
  constructor() {
    super('Run cancelled');
    this.name = 'CancelledError';
  }
}

/* ── Cancellation control ──────────────────────────────────────── */

let cancelled = false;

export function requestCancel(): void {
  cancelled = true;
}

export function resetCancel(): void {
  cancelled = false;
}

export function isCancelled(): boolean {
  return cancelled;
}

export function throwIfCancelled(): void {
  if (cancelled) throw new CancelledError();
}

/* ── Concurrency-limited queue ─────────────────────────────────── */

class TaskQueue {
  private concurrency: number;
  private active = 0;
  private waiting: Array<() => void> = [];

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  setConcurrency(n: number): void {
    this.concurrency = Math.max(1, n);
    this.drain();
  }

  private drain(): void {
    while (this.active < this.concurrency && this.waiting.length > 0) {
      this.active++;
      const next = this.waiting.shift()!;
      next();
    }
  }

  private release(): void {
    this.active--;
    this.drain();
  }

  /** Run `fn` when a slot frees up. The slot is held until `fn` settles. */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    throwIfCancelled();

    if (this.active < this.concurrency) {
      this.active++;
    } else {
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }

    try {
      throwIfCancelled();
      return await fn();
    } finally {
      this.release();
    }
  }
}

export const aiQueue = new TaskQueue(DEFAULT_CONCURRENCY);

/* ── Retry with exponential backoff ────────────────────────────── */

const RETRYABLE_PATTERNS = [
  '429',
  'RESOURCE_EXHAUSTED',
  'rate limit',
  'quota',
  '500',
  '503',
  'INTERNAL',
  'UNAVAILABLE',
  'overloaded',
  'fetch failed',
  'network',
  'ECONNRESET',
];

function isRetryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return RETRYABLE_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 4, baseDelayMs = 2000, maxDelayMs = 30000 }: RetryOptions = {}
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    throwIfCancelled();
    try {
      return await fn();
    } catch (error) {
      if (error instanceof CancelledError) throw error;
      lastError = error;

      if (attempt === retries || !isRetryable(error)) throw error;

      // Exponential backoff with full jitter
      const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const delay = Math.round(exp / 2 + Math.random() * (exp / 2));
      console.warn(
        `[BxAI] Retryable API error (attempt ${attempt + 1}/${retries}), backing off ${delay}ms:`,
        error instanceof Error ? error.message : error
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * The standard wrapper for every AI API request: waits for a queue slot,
 * then runs the call with retry/backoff. Cancellation short-circuits both.
 */
export function throttledAICall<T>(fn: () => Promise<T>, retry?: RetryOptions): Promise<T> {
  return aiQueue.run(() => withRetry(fn, retry));
}
