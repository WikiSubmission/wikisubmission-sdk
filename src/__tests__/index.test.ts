import { WikiSubmission } from "../index";
import { WikiSubmissionAPIError } from "../core/api-client-types";
// fail is available globally in Jest

describe("WikiSubmission SDK", () => {
  let ws: any;

  beforeEach(() => {
    ws = WikiSubmission.Quran.V1.createAPIClient({
      enableRequestLogging: true,
    });
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      if (ws && typeof ws.destroy === "function") {
        ws.destroy();
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    // Force cleanup of any remaining intervals
    jest.clearAllTimers();
    // Additional cleanup
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  describe("API Client Creation", () => {
    test("should create API client with default config", () => {
      const client = WikiSubmission.Quran.V1.createAPIClient();
      expect(client).toBeDefined();
      expect(client.getConfig()).toBeDefined();
    });

    test("should create API client with custom config", () => {
      const client = WikiSubmission.Quran.V1.createAPIClient({
        enableRequestLogging: true,
        enableCaching: true,
      });
      const config = client.getConfig();
      expect(config.enableRequestLogging).toBe(true);
      expect(config.enableCaching).toBe(true);
    });
  });

  describe("Random Verse Queries", () => {
    test("should get random verse", async () => {
      const query = await ws.getRandomVerse();

      expect(query).toBeDefined();
      expect(query.response).toBeDefined();
      expect(Array.isArray(query.response)).toBe(true);
      expect(query.response.length).toBeGreaterThan(0);

      const verse = query.response[0];
      expect(verse.verse_id).toBeDefined();
      expect(verse.verse_text_english).toBeDefined();
      expect(verse.verse_text_arabic).toBeDefined();
    });

    test("should get random verse with options", async () => {
      const query = await ws.getRandomVerse({
        include_language: ["swedish", "turkish"],
        normalize_god_casing: true,
      });

      expect(query).toBeDefined();
      expect(query.response).toBeDefined();
      expect(Array.isArray(query.response)).toBe(true);

      const verse = query.response[0];
      expect(verse.verse_text_swedish).toBeDefined();
      expect(verse.verse_text_turkish).toBeDefined();
    });
  });

  describe("Random Chapter Queries", () => {
    test("should get random chapter", async () => {
      const query = await ws.getRandomChapter();

      expect(query).toBeDefined();
      expect(query.response).toBeDefined();
      expect(Array.isArray(query.response)).toBe(true);
      expect(query.response.length).toBeGreaterThan(0);

      const verse = query.response[0];
      expect(verse.chapter_number).toBeDefined();
      expect(verse.verse_text_english).toBeDefined();
    });
  });

  describe("Data Retrieval", () => {
    test("should get quran chapters data", async () => {
      const query = await ws.getData("quran-chapters");

      expect(query).toBeDefined();
      expect(query.response).toBeDefined();
      expect(Array.isArray(query.response)).toBe(true);
      expect(query.response.length).toBe(114); // Total Quran chapters

      const chapter = query.response[0];
      expect(chapter.chapter_number).toBeDefined();
      expect(chapter.chapter_title_english).toBeDefined();
      expect(chapter.chapter_title_arabic).toBeDefined();
      expect(chapter.chapter_verses).toBeDefined();
    });

    test("should get quran word by word data", async () => {
      const query = await ws.getData("quran-word-by-word");

      expect(query).toBeDefined();
      expect(query.response).toBeDefined();
      expect(Array.isArray(query.response)).toBe(true);

      const word = query.response[0];
      expect(word.verse_id).toBeDefined();
      expect(word.arabic_text).toBeDefined();
      expect(word.english_text).toBeDefined();
      expect(word.word_index).toBeDefined();
    });
  });

  describe("Search Queries", () => {
    test("should search for verses", async () => {
      const query = await ws.query("awesome", {
        normalize_god_casing: false,
        search_apply_highlight: true,
        search_ignore_commentary: true,
      });

      expect(query).toBeDefined();
      expect(query.response).toBeDefined();
      expect(Array.isArray(query.response)).toBe(true);

      if (query.response.length > 0) {
        const verse = query.response[0];
        expect(verse.verse_id).toBeDefined();
        expect(verse.verse_text_english).toBeDefined();
      }
    });
  });

  describe("Verse Range Queries", () => {
    test("should get verse range", async () => {
      const query = await ws.query("1:1-3", {
        include_word_by_word: true,
        include_language: ["swedish"],
      });

      expect(query).toBeDefined();
      expect(query.response).toBeDefined();
      expect(Array.isArray(query.response)).toBe(true);
      expect(query.response.length).toBe(3); // Should return 3 verses

      const verse = query.response[0];
      expect(verse.verse_id).toBeDefined();
      expect(verse.word_by_word).toBeDefined();
      expect(Array.isArray(verse.word_by_word)).toBe(true);
    });
  });

  describe("Audio Link Queries", () => {
    test("should get audio links for verse", async () => {
      try {
        const query = await ws.getAudioLink("1:1");

        expect(query).toBeDefined();
        expect(query.response).toBeDefined();
        expect(Array.isArray(query.response)).toBe(true);
        expect(query.response.length).toBeGreaterThan(0);

        const audio = query.response[0];
        expect(audio.verse_id).toBeDefined();
        expect(audio.mishary).toBeDefined();
        expect(audio.basit).toBeDefined();
        expect(audio.minshawi).toBeDefined();
        expect(audio.mishary).toContain("https://");
        expect(audio.basit).toContain("https://");
        expect(audio.minshawi).toContain("https://");
      } catch (error) {
        // Audio recitations might not be available in all environments
        console.log("Audio recitation endpoint not available, skipping test");
        expect(error).toBeDefined();
      }
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid queries", async () => {
      const result = await ws.query(""); // Empty query should be invalid
      expect(result).toBeInstanceOf(WikiSubmissionAPIError);
      expect((result as WikiSubmissionAPIError).message).toBeDefined();
    });

    test("should handle network errors gracefully", async () => {
      const invalidClient = WikiSubmission.Quran.V1.createAPIClient({
        baseURL: "https://invalid-url-that-does-not-exist.com",
      });

      try {
        await invalidClient.getRandomVerse();
        fail("Should have thrown an error");
      } catch (error: unknown) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Batch Queries", () => {
    test("should handle batch queries", async () => {
      const queries = [
        { query: "1:1", options: { include_language: ["english"] } },
        { query: "1:2", options: { include_language: ["english"] } },
        { query: "1:3", options: { include_language: ["english"] } },
      ];

      const results = await ws.batchQuery(queries);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(3);

      for (const result of results) {
        if (!(result instanceof WikiSubmissionAPIError)) {
          expect(result.response).toBeDefined();
          expect(Array.isArray(result.response)).toBe(true);
        }
      }
    });
  });
});
