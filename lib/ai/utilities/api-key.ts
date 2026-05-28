export function getOpenAiApiKeyFromEnv(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

export function requireOpenAiApiKey(): string {
  const key = getOpenAiApiKeyFromEnv();
  if (!key) {
    throw new Error("Server configuration error: missing OPENAI_API_KEY.");
  }
  return key;
}
