import z from "zod";
import { QuranV1Schemas } from "./schemas";
import { VerseIndices } from "../../data/verse-indices";

export class QuranV1Methods {
  static parseQuery = (
    query: string,
    options?: Partial<z.infer<typeof QuranV1Schemas.QueryOptions>>
  ): z.infer<typeof QuranV1Schemas.ParsedQuery> => {
    const parsedOptions = QuranV1Schemas.QueryOptions.parse(options || {});

    try {
      const chapterResult = this.chapterOnlyMatch(query);

      if (chapterResult) {
        return {
          valid: true,
          type: "chapter",
          query: query,
          indices: chapterResult,
          options: parsedOptions,
          metadata: {
            title: `Chapter ${chapterResult[0].chapter}`,
          },
        };
      }

      const verseResult = this.verseMatch(query);
      if (verseResult) {
        return {
          valid: true,
          type: "verse",
          query: query,
          indices: [
            {
              ...verseResult,
            },
          ],
          options: parsedOptions,
          metadata: {
            title: `Verse ${verseResult.chapter}:${verseResult.verse}`,
          },
        };
      }

      const verseRangeResult = this.verseRangeMatch(query);
      if (verseRangeResult) {
        return {
          valid: true,
          type: "verse_range",
          query: query,
          indices: verseRangeResult,
          options: parsedOptions,
          metadata: {
            title: `Verses ${verseRangeResult[0].chapter}:${verseRangeResult[0].verse}-${verseRangeResult[verseRangeResult.length - 1].verse}`,
          },
        };
      }

      const multipleVersesResult = this.multipleVersesMatch(query);
      if (multipleVersesResult) {
        return {
          valid: true,
          type: "multiple_verses",
          query: query,
          indices: multipleVersesResult,
          options: parsedOptions,
          metadata: {
            title: `Verses ${query.substring(0, 256)}`,
          },
        };
      }

      const randomChapterResult = this.randomChapterMatch(query);
      if (randomChapterResult) {
        return {
          valid: true,
          type: "random_chapter",
          query: query,
          indices: [],
          options: parsedOptions,
          metadata: {
            title: `Random Chapter`,
          },
        };
      }

      const randomVerseResult = this.randomVerseMatch(query);
      if (randomVerseResult) {
        return {
          valid: true,
          type: "random_verse",
          query: query,
          indices: [],
          options: parsedOptions,
          metadata: {
            title: `Random Verse`,
          },
        };
      }

      const searchResult = this.searchMatch(query);
      if (searchResult) {
        return {
          valid: true,
          type: "search",
          query: query,
          indices: [],
          options: parsedOptions,
          metadata: {
            title: generateSearchMetadata(query),
          },
        };

        function generateSearchMetadata(query: string) {
          if (query.startsWith("root:") && query.length > 5) {
            return `Root: ${query.split("root:")?.[1]}`;
          }

          if (query.startsWith("chapter:") && query.length > 8) {
            return `Chapter: ${query.split("chapter:")?.[1]}`;
          }

          if (query.startsWith("verse:") && query.length > 6) {
            return `Verse: ${query.split("verse:")?.[1]}`;
          }

          if (query === "random-verse") {
            return `Random Verse`;
          }

          if (query === "random-chapter") {
            return `Random Chapter`;
          }

          if (query.startsWith("data:") && query.length > 5) {
            return `Data: ${query.split("data:")?.[1]}`;
          }

          return query;
        }
      }

      return {
        valid: false,
        error: "Invalid query",
      };
    } catch (error) {
      console.error(error);
      return {
        valid: false,
        error: "Internal server error",
      };
    }
  };

  static resolveLanguage = (
    input: string
  ): z.infer<typeof QuranV1Schemas.SupportedLanguages>[] => {
    const languages = input.split(",").map(lang => lang.trim().toLowerCase());
    const resolvedLanguages: z.infer<
      typeof QuranV1Schemas.SupportedLanguages
    >[] = [];

    for (const lang of languages) {
      if (QuranV1Schemas.SupportedLanguages.safeParse(lang).success) {
        resolvedLanguages.push(
          lang as z.infer<typeof QuranV1Schemas.SupportedLanguages>
        );
      }
    }

    return resolvedLanguages.length > 0 ? resolvedLanguages : ["english"];
  };

  /**
   *
   *
   *
   *
   * INTERNAL
   *
   *
   *
   *
   *
   */

  private static chapterOnlyMatch = (
    query?: string
  ): z.infer<typeof QuranV1Schemas.VerseIndex>[] | null => {
    if (!query) return null;
    let possibleCh: string | null = null;
    if (query.startsWith("chapter:")) {
      possibleCh = query?.split("chapter:")?.[1];
    }
    if (query.match(/^(\d+)$/)) {
      possibleCh = query || null;
    }
    if (possibleCh) {
      const possibleChNumber = parseInt(possibleCh, 10);
      const isNumber = !isNaN(possibleChNumber);
      const isWithinRange = possibleChNumber >= 1 && possibleChNumber <= 114;

      if (isNumber && isWithinRange) {
        const result = VerseIndices.filter(i => i.chapter === possibleChNumber);
        return result.length > 0 ? result : null;
      }
    }
    return null;
  };

  private static verseMatch = (
    query?: string
  ): z.infer<typeof QuranV1Schemas.VerseIndex> | null => {
    if (!query) return null;
    const match = VerseIndices.find(i => {
      return `${i.chapter}:${i.verse}` === query;
    });
    return match ? match : null;
  };

  private static verseRangeMatch = (
    query?: string
  ): z.infer<typeof QuranV1Schemas.VerseIndex>[] | null => {
    if (!query) return null;

    if (!query.includes("-") || query.endsWith("-")) return null;

    const match = VerseIndices.filter(i => {
      const queryCh = Number(query.split(":")?.[0]);
      const queryVer = Number(query.split("-")?.[0]?.split(":")?.[1]);
      const queryVerEnd = Number(query.split("-")?.[1]);
      return (
        i.chapter === queryCh && i.verse >= queryVer && i.verse <= queryVerEnd
      );
    });

    if (match.length > 0) {
      return match;
    }

    return null;
  };

  private static multipleVersesMatch = (
    query?: string
  ): z.infer<typeof QuranV1Schemas.VerseIndex>[] | null => {
    if (!query) return null;

    if (!query.includes(",")) return null;

    let results: z.infer<typeof QuranV1Schemas.VerseIndex>[] = [];
    for (const component of query.split(",")) {
      const basis = component.trim();

      // [Use existing functions to detect verse in component]
      const singleMatch = this.verseMatch(basis);
      if (singleMatch) {
        results.push(singleMatch);
        continue;
      }
      const rangeMatch = this.verseRangeMatch(basis);
      if (rangeMatch) {
        results.push(...rangeMatch);
      }
    }

    return results.length > 0 ? results : null;
  };

  private static randomChapterMatch = (query?: string): boolean => {
    if (!query) return false;
    return (
      query?.toLowerCase().includes("random") &&
      query?.toLowerCase().includes("chapter")
    );
  };

  private static randomVerseMatch = (query?: string): boolean => {
    if (!query) return false;
    return (
      query?.toLowerCase().includes("random") &&
      query?.toLowerCase().includes("verse")
    );
  };

  private static searchMatch = (query: string): boolean => {
    if (!query || typeof query !== "string") return false;

    // Trim whitespace
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return false;

    // If query contains only numbers, colons, commas, hyphens, or whitespace, it's likely a verse reference, not a search
    if (/^[\d:,\-\s]+$/.test(trimmedQuery)) return false;

    // If query is very short (1-2 chars) and doesn't contain letters, probably not a search
    if (trimmedQuery.length <= 2 && !/[a-zA-Z]/.test(trimmedQuery))
      return false;

    // Must contain at least one alphabetic character to be considered a search query
    return /[a-zA-Z]/.test(trimmedQuery);
  };
}
