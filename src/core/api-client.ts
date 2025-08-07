import axios, { AxiosInstance, CancelTokenSource } from "axios";
import {
  APIConfig,
  CacheEntry,
  WikiSubmissionAPIError,
} from "./api-client-types";
import { WikiSubmission } from "..";

export abstract class WikiSubmissionAPIClient {
  protected readonly axiosInstance: AxiosInstance;
  protected readonly config: Required<APIConfig>;
  protected readonly cache: Map<string, CacheEntry> = new Map();
  protected readonly activeRequests: Map<string, CancelTokenSource> = new Map();
  private cacheCleanupInterval?: NodeJS.Timeout;

  constructor(config: APIConfig) {
    this.config = {
      baseURL: config.baseURL || "",
      timeoutMs: config.timeoutMs || 10000, // 10 seconds
      retryCount: config.retryCount || 3, // 3 retries
      retryDelayMs: config.retryDelayMs || 1000, // 1 second
      enableCaching: config.enableCaching || false,
      cacheMaxAgeMs: config.cacheMaxAgeMs || 300000, // 5 minutes
      enableRequestLogging: config.enableRequestLogging || false,
      headers: config.headers || {},
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeoutMs,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `wikisubmission-sdk/${WikiSubmission.SDKVersion}`,
        ...this.config.headers,
      },
    });

    // Setup logging if enabled
    if (this.config.enableRequestLogging) {
      this.setupLogging();
    }

    // Start cache cleanup if enabled (but not in test environment)
    if (this.config.enableCaching && process.env.NODE_ENV !== "test") {
      this.cacheCleanupInterval = setInterval(() => this.cleanupCache(), 60000);
    }
  }

  /**
   * Execute HTTP request with retry logic
   */
  protected async executeRequest<T = any>(
    method: string,
    url: string,
    params?: any,
    options?: { skipCache?: boolean; abortSignal?: AbortSignal }
  ): Promise<T | WikiSubmissionAPIError> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.config.retryCount; attempt++) {
      const requestId = this.generateRequestId();

      try {
        // Create cancel token
        const cancelTokenSource = axios.CancelToken.source();
        this.activeRequests.set(requestId, cancelTokenSource);

        // Setup abort signal if provided
        if (options?.abortSignal) {
          options.abortSignal.addEventListener("abort", () => {
            cancelTokenSource.cancel("Request aborted");
          });
        }

        // Convert array parameters to comma-separated strings (e.g. ['turkish', 'french'] -> 'turkish,french').
        const processedParams = { ...params };
        Object.entries(processedParams).forEach(([key, value]) => {
          if (Array.isArray(value)) processedParams[key] = value.join(",");
        });

        // Make request
        const response = await this.axiosInstance.request({
          method,
          url,
          params: processedParams,
          timeout: this.config.timeoutMs,
          cancelToken: cancelTokenSource.token,
        });

        // Clean up
        this.activeRequests.delete(requestId);

        return response.data;
      } catch (error: any) {
        // Clean up
        this.activeRequests.delete(requestId);
        lastError = error;

        // Don't retry on last attempt or if error shouldn't be retried
        if (attempt === this.config.retryCount || !this.shouldRetry(error)) {
          break;
        }

        // Exponential backoff
        const delay = this.config.retryDelayMs * Math.pow(2, attempt);
        await this.delay(delay);
      }
    }

    // Handle axios errors
    if (axios.isAxiosError(lastError)) {
      return new WikiSubmissionAPIError(
        lastError.response?.data?.error || lastError.message || "Network error"
      );
    }

    return new WikiSubmissionAPIError(lastError.message || "Network error");
  }

  /**
   * Cancel active request by ID
   */
  public cancelRequest(requestId: string): boolean {
    const cancelToken = this.activeRequests.get(requestId);
    if (cancelToken) {
      cancelToken.cancel("Request cancelled by user");
      this.activeRequests.delete(requestId);
      return true;
    }
    return false;
  }

  /**
   * Cancel all active requests
   */
  public cancelAllRequests(): number {
    const count = this.activeRequests.size;
    this.activeRequests.forEach(cancelToken => {
      cancelToken.cancel("All requests cancelled");
    });
    this.activeRequests.clear();
    return count;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; maxAge: number } {
    return {
      size: this.cache.size,
      maxAge: this.config.cacheMaxAgeMs,
    };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  public destroy(): void {
    // Clear cache cleanup interval
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = undefined;
    }

    // Cancel all active requests
    this.cancelAllRequests();

    // Clear cache
    this.clearCache();

    // Close axios instance
    if (this.axiosInstance) {
      this.axiosInstance.defaults.timeout = 0;
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<APIConfig>): void {
    Object.assign(this.config, newConfig);

    if (newConfig.timeoutMs) {
      this.axiosInstance.defaults.timeout = newConfig.timeoutMs;
    }
    if (newConfig.baseURL) {
      this.axiosInstance.defaults.baseURL = newConfig.baseURL;
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): APIConfig {
    return { ...this.config };
  }

  // Protected helper methods
  protected generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected generateCacheKey(key: string, options?: any): string {
    return `${key}_${JSON.stringify(options || {})}`;
  }

  protected getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < entry.maxAge) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  protected setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      maxAge: this.config.cacheMaxAgeMs,
    });
  }

  protected cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  protected shouldRetry(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      return !status || status >= 500 || status === 408 || status === 429;
    }
    return false;
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Setup simple request/response logging
   */
  private setupLogging(): void {
    // ANSI color codes for terminal output
    const colors = {
      reset: "\x1b[0m",
      bright: "\x1b[1m",
      blue: "\x1b[34m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      red: "\x1b[31m",
      bgBlue: "\x1b[44m",
      bgGreen: "\x1b[42m",
      bgYellow: "\x1b[43m",
      bgRed: "\x1b[41m",
      white: "\x1b[37m",
    };

    this.axiosInstance.interceptors.request.use(
      config => {
        const fullUrl = config.baseURL
          ? `${config.baseURL}${config.url}`
          : config.url;
        const queryString = config.params
          ? `?${new URLSearchParams(config.params).toString()}`
          : "";
        const completeUrl = `${fullUrl}${queryString}`;

        // Decode the URL for better readability
        const decodedUrl = decodeURIComponent(completeUrl);
        console.log(
          `${colors.bgBlue}${colors.white}${colors.bright}[REQUEST]${colors.reset} ${colors.blue}${config.method?.toUpperCase()} ${decodedUrl}${colors.reset}`
        );

        // Add timestamp for timing
        (config as any).metadata = { startTime: Date.now() };
        return config;
      },
      error => {
        console.error(
          `${colors.bgRed}${colors.white}${colors.bright}[REQUEST ERROR]${colors.reset} ${colors.red}${error.message}${colors.reset}`
        );
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      response => {
        const status = response.status;
        const bgColor =
          status >= 200 && status < 300
            ? colors.bgGreen
            : status >= 400 && status < 500
              ? colors.bgYellow
              : colors.bgRed;
        const textColor =
          status >= 200 && status < 300
            ? colors.green
            : status >= 400 && status < 500
              ? colors.yellow
              : colors.red;

        // Calculate ping time
        const startTime = (response.config as any).metadata?.startTime;
        const pingTime = startTime ? Date.now() - startTime : null;
        const pingText = pingTime ? ` (${pingTime}ms)` : "";

        console.log(
          `${bgColor}${colors.white}${colors.bright}[RESPONSE]${colors.reset} ${textColor}${status}${pingText}${colors.reset}`
        );
        return response;
      },
      error => {
        const status = error.response?.status || "NETWORK";

        // Calculate ping time for errors too
        const startTime = (error.config as any)?.metadata?.startTime;
        const pingTime = startTime ? Date.now() - startTime : null;
        const pingText = pingTime ? ` (${pingTime}ms)` : "";

        console.error(
          `${colors.bgRed}${colors.white}${colors.bright}[RESPONSE]${colors.reset} ${colors.red}${status}${pingText}${colors.reset}`
        );
        return Promise.reject(error);
      }
    );
  }
}
