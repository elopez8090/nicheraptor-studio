import { getErrorMessage } from "@/lib/utils/error-helpers";

type SafeFetchJsonOptions = RequestInit & {
  fallbackError?: string;
};

export async function safeFetchJson<T>(
  input: RequestInfo | URL,
  options?: SafeFetchJsonOptions,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const fallbackError = options?.fallbackError ?? "Request failed.";

  try {
    const response = await fetch(input, options);
    const data = (await response.json().catch(() => null)) as
      | T
      | { error?: string; details?: string }
      | null;

    if (!response.ok) {
      const error =
        (data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error
          : null) ??
        (data && typeof data === "object" && "details" in data && typeof data.details === "string"
          ? data.details
          : null) ??
        fallbackError;
      return { ok: false, error, status: response.status };
    }

    return { ok: true, data: (data ?? ({} as T)) as T };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error, fallbackError) };
  }
}
