export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

const DEFAULT_SHOULD_RETRY = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  const msg = error.message.toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("503") ||
    msg.includes("502") ||
    msg.includes("timeout") ||
    msg.includes("econnreset")
  );
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 1);
  const baseDelayMs = options.baseDelayMs ?? 800;
  const shouldRetry = options.shouldRetry ?? DEFAULT_SHOULD_RETRY;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }
      await new Promise((r) => setTimeout(r, baseDelayMs * attempt));
    }
  }
  throw lastError;
}
