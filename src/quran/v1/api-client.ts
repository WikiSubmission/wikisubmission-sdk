import { z } from "zod";
import { WikiSubmissionAPIClient } from "../../core/api-client";
import {
  APIClientOptions,
  APIConfig,
  APIResponse,
  WikiSubmissionAPIError,
} from "../../core/api-client-types";
import { QuranV1Schemas } from "./schemas";
import { QuranV1Constants } from "./constants";
import { QuranV1Methods } from "./methods";

export class QuranV1APIClient extends WikiSubmissionAPIClient {
  constructor(config?: APIConfig) {
    super({
      baseURL: QuranV1Constants.BaseURL,
      ...config,
    });
  }

  /**
   * Main query method
   */
  async query<T = z.infer<typeof QuranV1Schemas.QuranData>[]>(
    query: string,
    queryOptions?: Partial<z.infer<typeof QuranV1Schemas.QueryOptions>>,
    apiClientOptions: APIClientOptions = {}
  ): Promise<
    | APIResponse<T, z.infer<typeof QuranV1Schemas.ParsedQuery>>
    | WikiSubmissionAPIError
  > {
    // Parse query
    const parsedQuery = QuranV1Methods.parseQuery(query, queryOptions);
    if (!parsedQuery.valid) {
      return new WikiSubmissionAPIError(
        "error" in parsedQuery ? parsedQuery.error : "Invalid query"
      );
    }

    // Check cache if enabled
    if (this.config.enableCaching && !apiClientOptions.skipCache) {
      const cacheKey = this.generateCacheKey(query, queryOptions);
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    // Execute request using base class
    const requestId = this.generateRequestId();
    const responseData = await this.executeRequest(
      "GET",
      "/",
      {
        q: query,
        type: parsedQuery.type,
        ...queryOptions,
      },
      {
        skipCache: apiClientOptions.skipCache,
        abortSignal: apiClientOptions.abortSignal,
      }
    );

    if (responseData instanceof WikiSubmissionAPIError || responseData.error) {
      return new WikiSubmissionAPIError(responseData.error || "Unknown error");
    }

    const data = responseData.response?.data || responseData || [];

    if (data.length === 0) {
      return new WikiSubmissionAPIError(`No verses found with "${query}"`);
    }

    const result: APIResponse = {
      id: requestId,
      request: {
        ...parsedQuery,
      },
      response: data,
    };

    // Cache result if enabled
    if (this.config.enableCaching && !apiClientOptions.skipCache) {
      const cacheKey = this.generateCacheKey(query, queryOptions);
      this.setCache(cacheKey, result);
    }

    return result;
  }

  /**
   * Batch query multiple requests (simplified)
   */
  async batchQuery<T = z.infer<typeof QuranV1Schemas.QuranData>[]>(
    queries: Array<{
      query: string;
      options?: any;
      apiClientOptions?: APIClientOptions;
    }>,
    concurrency: number = 3
  ): Promise<
    Array<
      | APIResponse<T, z.infer<typeof QuranV1Schemas.ParsedQuery>>
      | WikiSubmissionAPIError
    >
  > {
    const results: Array<APIResponse | WikiSubmissionAPIError> = [];

    // Process in batches
    for (let i = 0; i < queries.length; i += concurrency) {
      const batch = queries.slice(i, i + concurrency);
      const batchPromises = batch.map(
        async ({ query, options, apiClientOptions }) => {
          try {
            return await this.query(query, options, apiClientOptions);
          } catch (error) {
            return error instanceof WikiSubmissionAPIError
              ? error
              : new WikiSubmissionAPIError(
                  (error as any)?.message || "Unknown error"
                );
          }
        }
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get random verse
   */
  async getRandomVerse(
    queryOptions?: Partial<z.infer<typeof QuranV1Schemas.QueryOptions>>,
    apiClientOptions: APIClientOptions = {}
  ): Promise<
    | APIResponse<z.infer<typeof QuranV1Schemas.QuranData>[]>
    | WikiSubmissionAPIError
  > {
    return this.query("random-verse", queryOptions, apiClientOptions);
  }

  /**
   * Get random chapter
   */
  async getRandomChapter(
    queryOptions?: Partial<z.infer<typeof QuranV1Schemas.QueryOptions>>,
    apiClientOptions: APIClientOptions = {}
  ): Promise<
    | APIResponse<z.infer<typeof QuranV1Schemas.QuranData>[]>
    | WikiSubmissionAPIError
  > {
    return this.query("random-chapter", queryOptions, apiClientOptions);
  }

  /**
   * Get verse of the day
   */
  async getVerseOfTheDay(
    queryOptions?: Partial<z.infer<typeof QuranV1Schemas.QueryOptions>>,
    apiClientOptions: APIClientOptions = {}
  ): Promise<
    | APIResponse<z.infer<typeof QuranV1Schemas.QuranData>[]>
    | WikiSubmissionAPIError
  > {
    return this.query("verse-of-the-day", queryOptions, apiClientOptions);
  }

  /**
   * Get chapter of the day
   */
  async getChapterOfTheDay(
    queryOptions?: Partial<z.infer<typeof QuranV1Schemas.QueryOptions>>,
    apiClientOptions: APIClientOptions = {}
  ): Promise<
    | APIResponse<z.infer<typeof QuranV1Schemas.QuranData>[]>
    | WikiSubmissionAPIError
  > {
    return this.query("chapter-of-the-day", queryOptions, apiClientOptions);
  }

  /**
   * Get audio link for verses
   */
  async getRecitationData(
    verseId: string,
    apiClientOptions: APIClientOptions = {}
  ): Promise<
    | APIResponse<z.infer<typeof QuranV1Schemas.QuranAudioLinkData>[]>
    | WikiSubmissionAPIError
  > {
    return this.query(`recitations:${verseId}`, {}, apiClientOptions);
  }

  /**
   * Search verses by root word
   */
  async getVersesWithRoot(
    root: string,
    apiClientOptions: APIClientOptions = {}
  ): Promise<
    | APIResponse<z.infer<typeof QuranV1Schemas.QuranWordByWordData>[]>
    | WikiSubmissionAPIError
  > {
    return this.query<z.infer<typeof QuranV1Schemas.QuranWordByWordData>[]>(
      `root:${root}`,
      {},
      apiClientOptions
    );
  }

  /**
   * Get JSON data
   */
  async getData(
    data: "quran-chapters",
    apiClientOptions?: APIClientOptions
  ): Promise<
    | APIResponse<z.infer<typeof QuranV1Schemas.QuranChaptersData>[]>
    | WikiSubmissionAPIError
  >;

  async getData(
    data: "quran-word-by-word",
    apiClientOptions?: APIClientOptions
  ): Promise<
    | APIResponse<z.infer<typeof QuranV1Schemas.QuranWordByWordData>[]>
    | WikiSubmissionAPIError
  >;

  async getData(
    data: "quran" | "quran-foreign",
    apiClientOptions?: APIClientOptions
  ): Promise<
    | APIResponse<z.infer<typeof QuranV1Schemas.QuranData>[]>
    | WikiSubmissionAPIError
  >;

  async getData(
    data: "quran" | "quran-word-by-word" | "quran-chapters" | "quran-foreign",
    apiClientOptions: APIClientOptions = {}
  ): Promise<
    | APIResponse<z.infer<typeof QuranV1Schemas.QuranData>[]>
    | APIResponse<z.infer<typeof QuranV1Schemas.QuranWordByWordData>[]>
    | APIResponse<z.infer<typeof QuranV1Schemas.QuranChaptersData>[]>
    | WikiSubmissionAPIError
  > {
    if (data === "quran-word-by-word") {
      return this.query<z.infer<typeof QuranV1Schemas.QuranWordByWordData>[]>(
        `data:${data}`,
        {},
        apiClientOptions
      );
    } else if (data === "quran-chapters") {
      return this.query<z.infer<typeof QuranV1Schemas.QuranChaptersData>[]>(
        `data:${data}`,
        {},
        apiClientOptions
      );
    } else {
      return this.query<z.infer<typeof QuranV1Schemas.QuranData>[]>(
        `data:${data}`,
        {},
        apiClientOptions
      );
    }
  }
}
