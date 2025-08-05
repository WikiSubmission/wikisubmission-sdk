import { WikiSubmissionAPIClient } from "../core/api-client";
import { QuranV1APIClient } from "./v1/api-client";
import { QuranV1Methods } from "./v1/methods";
import { QuranV1Schemas } from "./v1/schemas";

export class Quran {
  static V1 = {
    createAPIClient: (config?: Partial<WikiSubmissionAPIClient["config"]>) => {
      return new QuranV1APIClient(config);
    },
    Methods: QuranV1Methods,
    Schemas: QuranV1Schemas,
  };

  static Credits = [
    {
      language: "english",
      authors: "Rashad Khalifa, Ph.D.",
      url: "https://masjidtucson.org",
    },
    {
      language: "turkish",
      authors: "Teslim Olanlar",
      url: "https://teslimiyetdini.com/",
    },
    {
      language: "french",
      authors: "Masjid Paris",
      url: "https://masjidparis.org",
    },
    {
      language: "german",
      authors: "Yunusemre Şentürk & Yusuf Balyemez",
      url: "https://github.com/SubmitterTech/quran-tft",
    },
    {
      language: "bahasa",
      authors: "Submission.org",
      url: "https://submission.org",
    },
    {
      language: "persian",
      authors: "MasjidTucson.org",
      url: "https://masjidtucson.org",
    },
    {
      language: "russian",
      authors: "Madina & Mila Komarnisky",
      url: "https://masjidtucson.org",
    },
    {
      language: "swedish",
      authors: "Swedish.submission.info",
      url: "https://swedish.submission.info",
    },
    {
      language: "tamil",
      authors: "Kadavulmattum",
      url: "https://kadavulmattum.org/",
    },
  ];
}
