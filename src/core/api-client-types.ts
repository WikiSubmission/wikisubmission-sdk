export interface APIConfig {
  baseURL?: string;
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  enableCaching?: boolean;
  cacheMaxAgeMs?: number;
  headers?: Record<string, string>;
  enableRequestLogging?: boolean;
}

export interface APIResponse<T = any, X = any> {
  id: string;
  request: X;
  response: T;
}

export interface APIClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipCache?: boolean;
  abortSignal?: AbortSignal;
}

export interface CacheEntry {
  data: APIResponse;
  timestamp: number;
  maxAge: number;
}

export class WikiSubmissionAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WikiSubmissionAPIError";
  }
}
