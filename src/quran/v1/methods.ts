import z from "zod";
import { QuranV1Schemas } from "./schemas";
import { VerseIndices } from "../../data/verse-indices";

export class QuranV1Methods {
  /**
   * Parses a query string into a structured query object.
   */
  static parseQuery = (
    query: string,
    options?: Partial<z.infer<typeof QuranV1Schemas.QueryOptions>>
  ): z.infer<typeof QuranV1Schemas.ParsedQuery> => {
    const parsedOptions = QuranV1Schemas.QueryOptions.parse(options || {});

    try {
      const chapterResult = this.isChapterType(query);

      if (chapterResult) {
        return {
          valid: true,
          type: "chapter",
          query,
          indices: chapterResult,
          options: parsedOptions,
          metadata: {
            title: `Chapter ${chapterResult[0].chapter}`,
          },
        };
      }

      const verseResult = this.isVerseType(query);
      if (verseResult) {
        return {
          valid: true,
          type: "verse",
          query,
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

      const verseRangeResult = this.isVerseRangeType(query);
      if (verseRangeResult) {
        return {
          valid: true,
          type: "verse_range",
          query,
          indices: verseRangeResult,
          options: parsedOptions,
          metadata: {
            title: `Verses ${verseRangeResult[0].chapter}:${verseRangeResult[0].verse}-${verseRangeResult[verseRangeResult.length - 1].verse}`,
          },
        };
      }

      const multipleVersesResult = this.isMultipleVersesType(query);
      if (multipleVersesResult) {
        return {
          valid: true,
          type: "multiple_verses",
          query,
          indices: multipleVersesResult,
          options: parsedOptions,
          metadata: {
            title: `Verses ${query.substring(0, 256)}`,
          },
        };
      }

      const randomChapterResult = this.isRandomChapterType(query);
      if (randomChapterResult) {
        return {
          valid: true,
          type: "random_chapter",
          query,
          indices: [],
          options: parsedOptions,
          metadata: {
            title: "Random Chapter",
          },
        };
      }

      const randomVerseResult = this.isRandomVerseType(query);
      if (randomVerseResult) {
        return {
          valid: true,
          type: "random_verse",
          query,
          indices: [],
          options: parsedOptions,
          metadata: {
            title: "Random Verse",
          },
        };
      }

      const searchResult = this.isSearchType(query);
      if (searchResult) {
        return {
          valid: true,
          type: "search",
          query,
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
            return "Random Verse";
          }

          if (query === "random-chapter") {
            return "Random Chapter";
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

  /**
   * Resolves a comma separated list of languages into a list of supported languages.
   */
  static resolveLanguageQuery = (
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
   * Returns a readable, language appropriate chapter title (e.g. Chapter 1, The Key) given a dataset.
   * If there are multiple chapters, it will return "Multiple Chapters".
   */
  static formatDataToChapterTitle(
    data: z.infer<typeof QuranV1Schemas.QuranData>[],
    language: z.infer<typeof QuranV1Schemas.SupportedLanguages>,
    useSuraAsPrefix: boolean = false
  ): string {
    if (data.every(i => i.chapter_number === data?.[0]?.chapter_number)) {
      return `${useSuraAsPrefix ? "Sura" : "Chapter"} ${data[0].chapter_number}, ${QuranV1Methods.getTitlePropertyForLanguage(data[0], language)}`;
    } else {
      return "Multiple Chapters";
    }
  }

  /**
   * Returns a language appropriate verse ID (e.g. 1:1 vs ١:١).
   */
  static formatDataToVerseId(
    data: z.infer<typeof QuranV1Schemas.QuranData>,
    language: z.infer<typeof QuranV1Schemas.SupportedLanguages>
  ): string {
    if (language === "arabic" || language === "persian") {
      return `${data.verse_id_arabic}`;
    }

    return `${data.verse_id}`;
  }

  static formatDataToStructuredText(
    data: z.infer<typeof QuranV1Schemas.QuranData>[],
    language: z.infer<typeof QuranV1Schemas.SupportedLanguages>,
    include: Partial<{
      verseSubtitle: boolean;
      verseId: boolean;
      verseText: boolean;
      verseArabic: boolean;
      verseForeignLanguageTexts: z.infer<
        typeof QuranV1Schemas.SupportedLanguages
      >[];
      verseTransliteration: boolean;
      verseFootnotes: boolean;
      markdownFormatting: boolean;
    }>
  ): z.infer<typeof QuranV1Schemas.StructuredVerseText>[] {
    const output: z.infer<typeof QuranV1Schemas.StructuredVerseText>[] = [];

    for (const i of data) {
      const structuredVerse: z.infer<
        typeof QuranV1Schemas.StructuredVerseText
      > = {
        verseSubtitle: include.verseSubtitle
          ? (() => {
              const subtitle =
                QuranV1Methods.getVerseSubtitlePropertyForLanguage(i, language);
              return subtitle && (include.markdownFormatting ?? false)
                ? `\`${subtitle}\``
                : subtitle;
            })()
          : null,
        verseId: include.verseId
          ? (() => {
              const verseId = QuranV1Methods.formatDataToVerseId(i, language);
              return (include.markdownFormatting ?? false)
                ? `**${verseId}**`
                : verseId;
            })()
          : null,
        verseText: include.verseText
          ? QuranV1Methods.getVerseTextPropertyForLanguage(i, language)
          : null,
        verseArabic: include.verseArabic ? i.verse_text_arabic : null,
        verseForeignLanguageTexts:
          include.verseForeignLanguageTexts &&
          include.verseForeignLanguageTexts.length > 0
            ? include.verseForeignLanguageTexts.reduce(
                (acc, lang) => {
                  const textKey = `verse_text_${lang}` as keyof z.infer<
                    typeof QuranV1Schemas.QuranData
                  >;
                  const subtitleKey = `verse_subtitle_${lang}` as keyof z.infer<
                    typeof QuranV1Schemas.QuranData
                  >;
                  const footnoteKey = `verse_footnote_${lang}` as keyof z.infer<
                    typeof QuranV1Schemas.QuranData
                  >;

                  const verseText = (i[textKey] as string) || null;
                  const subtitle = (i[subtitleKey] as string) || null;
                  const footnote = (i[footnoteKey] as string) || null;

                  if (verseText) {
                    acc[lang] = {
                      verseSubtitle:
                        subtitle && (include.markdownFormatting ?? false)
                          ? `\`${subtitle}\``
                          : subtitle,
                      verseId:
                        (include.markdownFormatting ?? false)
                          ? `**${QuranV1Methods.formatDataToVerseId(i, lang)}**`
                          : QuranV1Methods.formatDataToVerseId(i, lang),
                      verseText: verseText,
                      verseFootnotes:
                        footnote && (include.markdownFormatting ?? false)
                          ? `**${footnote}**`
                          : footnote,
                    };
                  }

                  return acc;
                },
                {} as Record<
                  z.infer<typeof QuranV1Schemas.SupportedLanguages>,
                  {
                    verseSubtitle: string | null;
                    verseId: string;
                    verseText: string;
                    verseFootnotes: string | null;
                  }
                >
              )
            : null,
        verseTransliteration: include.verseTransliteration
          ? i.verse_text_transliterated
          : null,
        verseFootnotes: include.verseFootnotes
          ? (() => {
              const footnote =
                QuranV1Methods.getVerseFootnotesPropertyForLanguage(
                  i,
                  language
                );
              return footnote && (include.markdownFormatting ?? false)
                ? `**${footnote}**`
                : footnote;
            })()
          : null,
      };

      output.push(structuredVerse);
    }

    return output;
  }

  /**
   * Returns an array of verse text strings in a readable format, with options to further add markdown, subtitles, footnotes, transliteration, and other languages.
   */
  static formatDataToText(
    data: z.infer<typeof QuranV1Schemas.QuranData>[],
    language: z.infer<typeof QuranV1Schemas.SupportedLanguages>,
    options?: Partial<{
      includeMarkdownFormatting: boolean;
      includeArabic: boolean;
      includeSubtitles: boolean;
      includeFootnotes: boolean;
      includeTransliteration: boolean;
      includeOtherLanguages: z.infer<
        typeof QuranV1Schemas.SupportedLanguages
      >[];
      removeMainText: boolean;
    }>
  ): string[] {
    const verses: string[] = [];
    for (const i of data) {
      const verseParts: string[] = [];

      if (options?.includeSubtitles && i.verse_subtitle_english) {
        const subtitle = QuranV1Methods.getVerseSubtitlePropertyForLanguage(
          i,
          language
        );
        verseParts.push(
          `${options?.includeMarkdownFormatting ? "`" : ""}${subtitle}${options?.includeMarkdownFormatting ? "`" : ""}`
        );
      }

      if (!options?.removeMainText) {
        const verseText = QuranV1Methods.getVerseTextPropertyForLanguage(
          i,
          language
        );
        verseParts.push(
          `${options?.includeMarkdownFormatting ? "**" : ""}[${QuranV1Methods.formatDataToVerseId(i, language)}]${options?.includeMarkdownFormatting ? "**" : ""} ${verseText}`
        );
      }

      if (options?.includeOtherLanguages) {
        for (const lang of options.includeOtherLanguages) {
          if (i[`verse_text_${lang}`]) {
            const otherLangText = i[`verse_text_${lang}`];
            verseParts.push(
              `${options?.includeMarkdownFormatting ? "**" : ""}[${QuranV1Methods.formatDataToVerseId(i, language)}]${options?.includeMarkdownFormatting ? "**" : ""} ${otherLangText}`
            );
          }
        }
      }

      if (options?.includeArabic && i.verse_text_arabic) {
        verseParts.push(`${i.verse_text_arabic}`);
      }

      if (options?.includeFootnotes && i.verse_footnote_english) {
        const footnote = QuranV1Methods.getVerseFootnotesPropertyForLanguage(
          i,
          language
        );
        verseParts.push(
          `${options?.includeMarkdownFormatting ? "*" : ""}${footnote}${options?.includeMarkdownFormatting ? "*" : ""}`
        );
      }

      if (options?.includeTransliteration && i.verse_text_transliterated) {
        verseParts.push(`${i.verse_text_transliterated}`);
      }

      const filteredVerseParts = verseParts.filter(i => i.length > 0);
      if (filteredVerseParts.length > 0) {
        verses.push(filteredVerseParts.join("\n\n"));
      }
    }

    return verses;
  }

  /**
   * Returns the appropriate book title for the language.
   */
  static getBookTitle(
    language: z.infer<typeof QuranV1Schemas.SupportedLanguages>
  ): string {
    switch (language) {
      case "english":
        return "Quran: The Final Testament";
      case "arabic":
        return "Quran: The Final Testament";
      case "persian":
        return "Quran: The Final Testament • Persian";
      case "turkish":
        return "Kuran: Son Ahit • Turkish";
      case "french":
        return "Quran: Le Testament Final • French";
      case "german":
        return "Koranen: Det Sista Testamentet • Swedish";
      case "bahasa":
        return "Quran: The Final Testament • Bahasa";
      case "tamil":
        return "Quran: The Final Testament இறுதி வேதம் • Tamil";
      case "swedish":
        return "Koranen: Det Sista Testamentet • Swedish";
      case "russian":
        return "Коран: Последний Завет • Russian";
      default:
        return "Quran: The Final Testament";
    }
  }

  /**
   * Returns the appropriate `chapter_title_{language}` property (defaults to English).
   */
  static getTitlePropertyForLanguage(
    data: z.infer<typeof QuranV1Schemas.QuranData>,
    language: z.infer<typeof QuranV1Schemas.SupportedLanguages>
  ): string {
    if (language === "english") {
      return data.chapter_title_english;
    } else if (language === "turkish") {
      return data.chapter_title_turkish || data.chapter_title_english;
    } else if (language === "french") {
      return data.chapter_title_french || data.chapter_title_english;
    } else if (language === "german") {
      return data.chapter_title_german || data.chapter_title_english;
    } else if (language === "bahasa") {
      return data.chapter_title_bahasa || data.chapter_title_english;
    } else if (language === "persian") {
      return data.chapter_title_persian || data.chapter_title_english;
    } else if (language === "tamil") {
      return data.chapter_title_tamil || data.chapter_title_english;
    } else if (language === "swedish") {
      return data.chapter_title_swedish || data.chapter_title_english;
    } else if (language === "russian") {
      return data.chapter_title_russian || data.chapter_title_english;
    } else {
      return data.chapter_title_english || "--";
    }
  }

  /**
   * Returns the appropriate `verse_text_{language}` property (defaults to English).
   */
  static getVerseTextPropertyForLanguage(
    data: z.infer<typeof QuranV1Schemas.QuranData>,
    language: z.infer<typeof QuranV1Schemas.SupportedLanguages>
  ): string {
    if (language === "english") {
      return data.verse_text_english;
    } else if (language === "turkish") {
      return data.verse_text_turkish || data.verse_text_english;
    } else if (language === "french") {
      return data.verse_text_french || data.verse_text_english;
    } else if (language === "german") {
      return data.verse_text_german || data.verse_text_english;
    } else if (language === "bahasa") {
      return data.verse_text_bahasa || data.verse_text_english;
    } else if (language === "persian") {
      return data.verse_text_persian || data.verse_text_english;
    } else if (language === "tamil") {
      return data.verse_text_tamil || data.verse_text_english;
    } else if (language === "swedish") {
      return data.verse_text_swedish || data.verse_text_english;
    } else if (language === "russian") {
      return data.verse_text_russian || data.verse_text_english;
    } else {
      return data.verse_text_english || "--";
    }
  }

  /**
   * Returns the appropriate `verse_subtitle_{language}` property (defaults to English).
   */
  static getVerseSubtitlePropertyForLanguage(
    data: z.infer<typeof QuranV1Schemas.QuranData>,
    language: z.infer<typeof QuranV1Schemas.SupportedLanguages>
  ): string | null {
    if (language === "english") {
      return data.verse_subtitle_english || null;
    } else {
      const subtitleKey = `verse_subtitle_${language}` as keyof z.infer<
        typeof QuranV1Schemas.QuranData
      >;
      if (subtitleKey in data && data[subtitleKey]) {
        return data[subtitleKey] as string | null;
      }
      return data.verse_subtitle_english || null;
    }
  }

  /**
   * Returns the appropriate `verse_footnote_{language}` property (defaults to English).
   */
  static getVerseFootnotesPropertyForLanguage(
    data: z.infer<typeof QuranV1Schemas.QuranData>,
    language: z.infer<typeof QuranV1Schemas.SupportedLanguages>
  ): string | null {
    if (language === "english") {
      return data.verse_footnote_english || null;
    } else {
      const footnoteKey = `verse_footnote_${language}` as keyof z.infer<
        typeof QuranV1Schemas.QuranData
      >;
      if (footnoteKey in data && data[footnoteKey]) {
        return data[footnoteKey] as string | null;
      }
      return data.verse_footnote_english || null;
    }
  }

  /**
   * Checks query for a chapter request and returns precomputed indices for the chapter (null otherwise).
   */
  static isChapterType = (
    query?: string
  ): z.infer<typeof QuranV1Schemas.VerseIndex>[] | null => {
    if (!query) {
      return null;
    }
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

  /**
   * Checks query for a verse request and returns precomputed index for the verse (null otherwise).
   */
  static isVerseType = (
    query?: string
  ): z.infer<typeof QuranV1Schemas.VerseIndex> | null => {
    if (!query) {
      return null;
    }
    const match = VerseIndices.find(i => {
      return `${i.chapter}:${i.verse}` === query;
    });
    return match || null;
  };

  /**
   * Checks query for a verse range request and returns precomputed indices for the range (null otherwise).
   */
  static isVerseRangeType = (
    query?: string
  ): z.infer<typeof QuranV1Schemas.VerseIndex>[] | null => {
    if (!query) {
      return null;
    }

    if (!query.includes("-") || query.endsWith("-")) {
      return null;
    }

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

  /**
   * Checks query for a multiple verses request and returns precomputed indices for the verses (null otherwise).
   */
  static isMultipleVersesType = (
    query?: string
  ): z.infer<typeof QuranV1Schemas.VerseIndex>[] | null => {
    if (!query) {
      return null;
    }

    if (!query.includes(",")) {
      return null;
    }

    const results: z.infer<typeof QuranV1Schemas.VerseIndex>[] = [];
    for (const component of query.split(",")) {
      const basis = component.trim();

      // [Use existing functions to detect verse in component]
      const singleMatch = this.isVerseType(basis);
      if (singleMatch) {
        results.push(singleMatch);
        continue;
      }
      const rangeMatch = this.isVerseRangeType(basis);
      if (rangeMatch) {
        results.push(...rangeMatch);
      }
    }

    return results.length > 0 ? results : null;
  };

  /**
   * Checks query for a random chapter request and returns true if the query is a random chapter request (false otherwise).
   */
  static isRandomChapterType = (query?: string): boolean => {
    if (!query) {
      return false;
    }
    return (
      query?.toLowerCase().includes("random") &&
      query?.toLowerCase().includes("chapter")
    );
  };

  /**
   * Checks query for a random verse request and returns true if the query is a random verse request (false otherwise).
   */
  static isRandomVerseType = (query?: string): boolean => {
    if (!query) {
      return false;
    }
    return (
      query?.toLowerCase().includes("random") &&
      query?.toLowerCase().includes("verse")
    );
  };

  /**
   * Checks query for a search request and returns true if the query is a search request (false otherwise).
   */
  static isSearchType = (query: string): boolean => {
    if (!query || typeof query !== "string") {
      return false;
    }

    // Trim whitespace
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return false;
    }

    // If query contains only numbers, colons, commas, hyphens, or whitespace, it's likely a verse reference, not a search
    if (/^[\d:,\-\s]+$/.test(trimmedQuery)) {
      return false;
    }

    // If query is very short (1-2 chars) and doesn't contain letters, probably not a search
    if (trimmedQuery.length <= 2 && !/[a-zA-Z]/.test(trimmedQuery)) {
      return false;
    }

    // Must contain at least one alphabetic character to be considered a search query
    return /[a-zA-Z]/.test(trimmedQuery);
  };
}
