/**
 * Retry utility with exponential backoff for Redux async thunks.
 *
 * Delays: 500ms → 1000ms → 2000ms (configurable)
 */

export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;      // ms – first retry delay
  maxDelay?: number;        // ms – cap
  retryCondition?: (error: any) => boolean;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 500,
  maxDelay: 8000,
  retryCondition: (error: any) => {
    // Don't retry auth errors or client-side errors (4xx except 408)
    const status = error?.response?.status;
    if (!status) return true;                      // network error → retry
    if (status === 408) return true;               // timeout → retry
    if (status === 429) return false;              // rate-limited → DON'T retry (let limit window reset)
    if (status >= 400 && status < 500) return false;    // other 4xx → don't retry
    return true;                                   // 5xx → retry
  },
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Execute an async function with retry + exponential backoff.
 *
 * @example
 * const data = await withRetry(() => postsAPI.getFeed({ page: 1 }), { maxRetries: 3 });
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: RetryConfig,
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // If out of retries or condition says don't retry, throw immediately
      if (attempt >= cfg.maxRetries || !cfg.retryCondition(error)) {
        throw error;
      }

      // Exponential backoff: 500 → 1000 → 2000 ...
      const ms = Math.min(cfg.baseDelay * Math.pow(2, attempt), cfg.maxDelay);
      await delay(ms);
    }
  }

  throw lastError;
}

/**
 * Standardise any error into a serialisable object for Redux state.
 */
export interface SerializedError {
  message: string;
  code?: string | number;
  status?: number;
  errors?: Array<{ field?: string; message: string }>;
}

export function serializeError(error: any): SerializedError {
  if (error?.response) {
    const validationErrors = Array.isArray(error.response.data?.errors)
      ? error.response.data.errors
          .map((e: any) => ({
            field: e?.field || e?.path,
            message: e?.message || e?.msg || 'Invalid value',
          }))
          .filter((e: { field?: string; message: string }) => Boolean(e.message))
      : undefined;

    const primaryValidationMessage = validationErrors?.[0]?.message;

    return {
      message: primaryValidationMessage || error.response.data?.message || error.message || 'Request failed',
      status: error.response.status,
      code: error.response.data?.code || error.response.status,
      errors: validationErrors,
    };
  }
  if (error?.message === 'Network Error' || !navigator?.onLine) {
    return { message: 'Network error — check your connection', code: 'NETWORK_ERROR' };
  }
  return {
    message: typeof error === 'string' ? error : error?.message || 'Unknown error',
    code: error?.code,
  };
}

/**
 * Check whether a cache timestamp is still fresh.
 * @param lastFetched  ISO string or epoch ms
 * @param ttl          milliseconds (default 2 min = 120 000)
 */
export function isCacheValid(lastFetched: string | number | null | undefined, ttl = 120_000): boolean {
  if (!lastFetched) return false;
  const ts = typeof lastFetched === 'string' ? new Date(lastFetched).getTime() : lastFetched;
  return Date.now() - ts < ttl;
}
