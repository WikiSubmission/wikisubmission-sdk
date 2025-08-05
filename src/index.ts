import { Quran } from "./quran";
import { WikiSubmissionAPIError } from "./core/api-client-types";

/**
 * @main
 */
export class WikiSubmission {
  static Quran = Quran;
  static Error = WikiSubmissionAPIError;
  static SDKVersion: string = String(
    require("../package.json")?.version || "1.0.0"
  );
}
