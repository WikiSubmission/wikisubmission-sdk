import { WikiSubmission } from "./index";

// [Run this file with `npm run playground`]

(async () => {
  const sampleVerseFetch = await WikiSubmission.Quran.V1.createAPIClient({
    enableRequestLogging: true,
    enableCaching: true,
  }).getRandomChapter({
    include_language: "russian",
  });

  if (sampleVerseFetch instanceof WikiSubmission.Error) {
    console.log(`[${sampleVerseFetch.name}] ${sampleVerseFetch.message}`);
  } else {
    const test = WikiSubmission.Quran.V1.Methods.formatDataToVerseText(
      sampleVerseFetch.response,
      "english",
      {
        includeMarkdownFormatting: false,
        includeArabic: true,
        includeSubtitles: false,
        includeFootnotes: false,
        includeTransliteration: false,
        includeOtherLanguages: [],
      }
    );
    console.log(test.join("\n\n"));
  }
})();

// (async () => {
//   // Create client
//   const ws = WikiSubmission.Quran.V1.createAPIClient({
//     enableRequestLogging: true,
//     enableCaching: true,
//   });

//   // Run query
//   const query = await ws.query("nineteen", {
//     search_apply_highlight: true,
//     search_ignore_commentary: true,
//   });

//   // Handle error
//   if (query instanceof WikiSubmission.Error) {
//     console.log(`[${query.name}] ${query.message}`);
//   } else {
//     // Result!
//     console.log("--------------------------------");
//     console.log(query.request);
//     console.log("--------------------------------");
//     console.log(
//       `[${query.response[0].verse_id}] ${query.response[0].verse_text_english}`
//     );
//     console.log("--------------------------------");
//   }
// })();
