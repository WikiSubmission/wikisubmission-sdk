import { z } from "zod";

export class QuranV1Schemas {
  static VerseIndex = z.object({
    chapter: z.number().int().min(1).max(114),
    verse: z.number().int().min(1),
    verse_index: z.number().int().min(1),
  });

  static SupportedLanguages = z.enum([
    "english",
    "turkish",
    "french",
    "german",
    "bahasa",
    "persian",
    "tamil",
    "swedish",
    "russian",
  ]);

  static QueryTypes = z.enum([
    "verse",
    "verse_range",
    "multiple_verses",
    "chapter",
    "search",
    "random_chapter",
    "random_verse",
  ]);

  static QueryOptions = z
    .object({
      sort_results: z
        .enum(["verse_index", "revelation_order"])
        .default("verse_index"),
      normalize_god_casing: z.boolean().default(false),
      include_word_by_word: z.boolean().default(false),
      include_language: z.string().default("none"),
      // Search-specific options
      search_strategy: z.enum(["exact", "fuzzy"]).default("fuzzy"),
      search_language: QuranV1Schemas.SupportedLanguages.default("english"),
      search_case_sensitive: z.boolean().default(false),
      search_ignore_commentary: z.boolean().default(false),
      search_apply_highlight: z.boolean().default(false),
    })
    .passthrough(); // Allow additional properties to pass through unhandled

  static ParsedQuery = z.discriminatedUnion("valid", [
    z.object({
      valid: z.literal(true),
      type: z.custom<z.infer<typeof QuranV1Schemas.QueryTypes>>(),
      query: z.string(),
      indices: z.array(QuranV1Schemas.VerseIndex),
      options: QuranV1Schemas.QueryOptions,
      metadata: z.object({
        title: z.string(),
      }),
    }),
    z.object({
      valid: z.literal(false),
      error: z.string(),
    }),
  ]);

  static QuranData = z.object({
    // Indices
    verse_id: z.string(),
    chapter_number: z.number(),
    verse_number: z.number(),
    verse_index: z.number(),
    verse_index_numbered: z.number().optional(),
    // Arabic text
    verse_text_arabic: z.string(),
    verse_text_transliterated: z.string(),
    // Chapter title
    chapter_title_english: z.string(),
    chapter_title_turkish: z.string().optional(),
    chapter_title_french: z.string().optional(),
    chapter_title_german: z.string().optional(),
    chapter_title_bahasa: z.string().optional(),
    chapter_title_persian: z.string().optional(),
    chapter_title_tamil: z.string().optional(),
    chapter_title_swedish: z.string().optional(),
    chapter_title_russian: z.string().optional(),
    // Word by word
    word_by_word: z.array(
      z.object({
        arabic_text: z.string(),
        transliteration: z.string(),
        transliterated_text: z.string(),
        root_word: z.string(),
        english_text: z.string(),
        word_index: z.number(),
      })
    ),
    // Verse text
    verse_text_english: z.string(),
    verse_text_turkish: z.string().optional(),
    verse_text_french: z.string().optional(),
    verse_text_german: z.string().optional(),
    verse_text_bahasa: z.string().optional(),
    verse_text_persian: z.string().optional(),
    verse_text_tamil: z.string().optional(),
    verse_text_swedish: z.string().optional(),
    verse_text_russian: z.string().optional(),
    // Verse subtitle
    verse_subtitle_english: z.string().optional(),
    verse_subtitle_turkish: z.string().optional(),
    verse_subtitle_french: z.string().optional(),
    verse_subtitle_german: z.string().optional(),
    verse_subtitle_bahasa: z.string().optional(),
    verse_subtitle_persian: z.string().optional(),
    verse_subtitle_tamil: z.string().optional(),
    verse_subtitle_swedish: z.string().optional(),
    verse_subtitle_russian: z.string().optional(),
    // Verse footnote
    verse_footnote_english: z.string().optional(),
    verse_footnote_turkish: z.string().optional(),
    verse_footnote_french: z.string().optional(),
    verse_footnote_german: z.string().optional(),
    verse_footnote_bahasa: z.string().optional(),
    verse_footnote_persian: z.string().optional(),
    verse_footnote_tamil: z.string().optional(),
    verse_footnote_swedish: z.string().optional(),
    verse_footnote_russian: z.string().optional(),
  });

  static QuranChaptersData = z.object({
    chapter_number: z.number(),
    chapter_title_english: z.string(),
    chapter_title_arabic: z.string(),
    chapter_title_transliterated: z.string(),
    chapter_verses: z.number(),
    chapter_revelation_order: z.number(),
  });

  static QuranWordByWordData = z.object({
    global_index: z.number(),
    word_index: z.number(),
    verse_id: z.string(),
    root_word: z.string(),
    english_text: z.string(),
    arabic_text: z.string(),
    transliterated_text: z.string(),
  });

  static QuranForeignData = z.object({
    verse_id: z.string(),

    verse_text_french: z.string(),
    verse_subtitle_french: z.string().optional(),
    verse_footnote_french: z.string().optional(),
    chapter_title_french: z.string(),

    verse_text_swedish: z.string(),
    verse_subtitle_swedish: z.string().optional(),
    verse_footnote_swedish: z.string().optional(),
    chapter_title_swedish: z.string(),

    verse_text_russian: z.string(),
    verse_subtitle_russian: z.string().optional(),
    verse_footnote_russian: z.string().optional(),
    chapter_title_russian: z.string(),

    verse_text_turkish: z.string(),
    verse_subtitle_turkish: z.string().optional(),
    verse_footnote_turkish: z.string().optional(),
    chapter_title_turkish: z.string(),

    verse_text_german: z.string(),
    verse_subtitle_german: z.string().optional(),
    verse_footnote_german: z.string().optional(),
    chapter_title_german: z.string(),

    verse_text_bahasa: z.string(),
    verse_subtitle_bahasa: z.string().optional(),
    verse_footnote_bahasa: z.string().optional(),
    chapter_title_bahasa: z.string(),

    verse_text_persian: z.string(),
    verse_subtitle_persian: z.string().optional(),
    verse_footnote_persian: z.string().optional(),
    chapter_title_persian: z.string(),

    verse_text_tamil: z.string(),
    verse_subtitle_tamil: z.string().optional(),
    verse_footnote_tamil: z.string().optional(),
    chapter_title_tamil: z.string(),
  });

  static QuranAudioLinkData = z.object({
    verse_id: z.string(),
    mishary: z.string(),
    basit: z.string(),
    minshawi: z.string(),
  });
}
