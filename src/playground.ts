import { WikiSubmission } from "./index";

// [Run this file with `npm run playground`]

(async () => {
  // Create client
  const ws = WikiSubmission.Quran.V1.createAPIClient({
    enableRequestLogging: true,
  });

  console.log("WikiSubmission SDK Playground");
  console.log("================================\n");

  // V1

  // ========================================
  // BASIC QUERIES
  // ========================================

  // Example: Search for verses containing "nineteen"
  // const searchResult = await ws.query("nineteen", {
  //   search_apply_highlight: true,
  //   search_ignore_commentary: true,
  // });
  // console.log("Search Results:");
  // console.log(searchResult);
  // console.log("\n");

  // Example: Get specific verse
  // const verseResult = await ws.query("1:1");
  // console.log("Single Verse:");
  // console.log(verseResult);
  // console.log("\n");

  // Example: Get verse range
  // const rangeResult = await ws.query("1:1-7");
  // console.log("Verse Range:");
  // console.log(rangeResult);
  // console.log("\n");

  // Example: Get entire chapter
  // const chapterResult = await ws.query("1");
  // console.log("Chapter:");
  // console.log(chapterResult);
  // console.log("\n");

  // Example: Get multiple specific verses
  // const multipleVersesResult = await ws.query("1:1,2:255,3:8");
  // console.log("Multiple Verses:");
  // console.log(multipleVersesResult);
  // console.log("\n");

  // ========================================
  // RANDOM CONTENT
  // ========================================

  // Example: Get random verse
  // const randomVerseResult = await ws.getRandomVerse();
  // console.log("Random Verse:");
  // console.log(randomVerseResult);
  // console.log("\n");

  // Example: Get random chapter
  // const randomChapterResult = await ws.getRandomChapter();
  // console.log("Random Chapter:");
  // console.log(randomChapterResult);
  // console.log("\n");

  // Example: Get verse of the day
  // const verseOfDayResult = await ws.getVerseOfTheDay();
  // console.log("Verse of the Day:");
  // console.log(verseOfDayResult);
  // console.log("\n");

  // Example: Get chapter of the day
  // const chapterOfDayResult = await ws.getChapterOfTheDay();
  // console.log("Chapter of the Day:");
  // console.log(chapterOfDayResult);
  // console.log("\n");

  // ========================================
  // ADVANCED SEARCHES
  // ========================================

  // Example: Search by root word
  // const rootSearchResult = await ws.query("root:ش ج ر");
  // console.log("Root Word Search:");
  // console.log(rootSearchResult);
  // console.log("\n");

  // Example: Search in specific chapter
  // const chapterSearchResult = await ws.query("chapter:1 mercy");
  // console.log("Chapter Search:");
  // console.log(chapterSearchResult);
  // console.log("\n");

  // Example: Search in specific verse
  // const verseSearchResult = await ws.query("verse:1:1 god");
  // console.log("Verse Search:");
  // console.log(verseSearchResult);
  // console.log("\n");

  // ========================================
  // MULTILINGUAL CONTENT
  // ========================================

  // Example: Get content in different languages
  // const turkishResult = await ws.query("1:1", { language: "turkish" });
  // console.log("Turkish Content:");
  // console.log(turkishResult);
  // console.log("\n");

  // const frenchResult = await ws.query("1:1", { language: "french" });
  // console.log("French Content:");
  // console.log(frenchResult);
  // console.log("\n");

  // const arabicResult = await ws.query("1:1", { language: "arabic" });
  // console.log("Arabic Content:");
  // console.log(arabicResult);
  // console.log("\n");

  // ========================================
  // FORMATTING EXAMPLES
  // ========================================

  // Example: Get formatted verse text with markdown
  // const formattedResult = await ws.query("1:1-3");
  // if (!(formattedResult instanceof WikiSubmission.Error)) {
  //   const formattedText = WikiSubmission.Quran.V1.Methods.formatDataToVerseText(
  //     formattedResult.response,
  //     "english",
  //     {
  //       includeMarkdownFormatting: true,
  //       includeArabic: true,
  //       includeSubtitles: true,
  //       includeFootnotes: true,
  //       includeTransliteration: true,
  //     }
  //   );
  //   console.log("Formatted Verse Text:");
  //   console.log(formattedText);
  //   console.log("\n");
  // }

  // Example: Get chapter title
  // const chapterTitleResult = await ws.query("1:2-3", {
  //   include_language: "turkish"
  // });
  // if (!(chapterTitleResult instanceof WikiSubmission.Error)) {
  //   const title = WikiSubmission.Quran.V1.Methods.formatDataToChapterTitle(
  //     chapterTitleResult.response,
  //     "turkish"
  //   );
  //   console.log("Chapter Title:");
  //   console.log(title);
  //   console.log("\n");
  // }

  // ========================================
  // AUDIO & RECITATION
  // ========================================

  // Example: Get recitation data
  // const recitationResult = await ws.getRecitationData("1:1");
  // console.log("Recitation Data:");
  // console.log(recitationResult);
  // console.log("\n");

  // ========================================
  // WORD-BY-WORD ANALYSIS
  // ========================================

  // Example: Get verses with specific root
  // const rootAnalysisResult = await ws.getVersesWithRoot("ش ج ر");
  // console.log("Root Analysis:");
  // console.log(rootAnalysisResult);
  // console.log("\n");

  // ========================================
  // DATA EXPORTS
  // ========================================

  // Example: Get complete Quran data
  // const completeDataResult = await ws.getData("quran");
  // console.log("Complete Quran Data:");
  // console.log(completeDataResult);
  // console.log("\n");

  // Example: Get word-by-word data
  // const wordByWordResult = await ws.getData("quran-word-by-word");
  // console.log("Word-by-Word Data:");
  // console.log(wordByWordResult);
  // console.log("\n");

  // Example: Get chapters data
  // const chaptersDataResult = await ws.getData("quran-chapters");
  // console.log("Chapters Data:");
  // console.log(chaptersDataResult);
  // console.log("\n");

  // ========================================
  // BATCH OPERATIONS
  // ========================================

  // Example: Batch query multiple requests
  // const batchResult = await ws.batchQuery([
  //   { query: "1:1" },
  //   { query: "2:255" },
  //   { query: "3:8" },
  //   { query: "nineteen" },
  // ], 2);
  // console.log("Batch Query Results:");
  // console.log(batchResult);
  // console.log("\n");

  // ========================================
  // ERROR HANDLING EXAMPLES
  // ========================================

  // Example: Handle invalid query
  // const invalidResult = await ws.query("invalid:query");
  // if (invalidResult instanceof WikiSubmission.Error) {
  //   console.log("Error Handling:");
  //   console.log(`Error: ${invalidResult.message}`);
  //   console.log(`Type: ${invalidResult.name}`);
  //   console.log("\n");
  // }

  // Example: Handle non-existent verse
  // const nonExistentResult = await ws.query("999:999");
  // if (nonExistentResult instanceof WikiSubmission.Error) {
  //   console.log("Non-existent Verse:");
  //   console.log(`Error: ${nonExistentResult.message}`);
  //   console.log("\n");
  // }

  // ========================================
  // UTILITY METHODS
  // ========================================

  // Example: Parse query manually
  // const parsedQuery = WikiSubmission.Quran.V1.Methods.parseQuery("1:1-5", {
  //   language: "english",
  //   search_apply_highlight: true,
  // });
  // console.log("Parsed Query:");
  // console.log(parsedQuery);
  // console.log("\n");

  // Example: Check query types
  // const queryTypes = [
  //   "1",
  //   "1:1",
  //   "1:1-5",
  //   "1:1,2:255",
  //   "nineteen",
  //   "random-verse",
  //   "root:ش ج ر"
  // ];

  // console.log("Query Type Analysis:");
  // for (const query of queryTypes) {
  //   const parsed = WikiSubmission.Quran.V1.Methods.parseQuery(query);
  //   console.log(`${query} -> ${parsed.valid ? `valid (type: ${parsed.type})` : "invalid"}`);
  // }
  // console.log("\n");

  // ========================================
  // CUSTOM FORMATTING EXAMPLES
  // ========================================

  // Example: Verse text formatting
  // const customFormatResult = await ws.query("1:1-3");
  // if (!(customFormatResult instanceof WikiSubmission.Error)) {
  //   const customFormatted = WikiSubmission.Quran.V1.Methods.formatDataToVerseText(
  //     customFormatResult.response,
  //     "english",
  //     {
  //       includeMarkdownFormatting: false,
  //       includeArabic: true,
  //       includeSubtitles: false,
  //       includeFootnotes: false,
  //       includeTransliteration: false,
  //       includeOtherLanguages: ["turkish", "french"]
  //     }
  //   );
  //   console.log("Formatted verses:\n");
  //   console.log(customFormatted.join("\n\n"));
  //   console.log("\n");
  // }

  console.log("✅ Playground completed!");
})();
