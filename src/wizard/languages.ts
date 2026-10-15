/** The languages INT-300 lists, in the order of their check boxes CheckBox64[1]…[10]. */
export const INT300_LANGUAGES = [
  "Vietnamese",
  "Farsi",
  "Punjabi",
  "Korean",
  "Russian",
  "Mandarin",
  "Tagalog",
  "Cantonese",
  "Spanish",
  "Arabic",
] as const;

const ALIASES: Record<string, (typeof INT300_LANGUAGES)[number]> = {
  spanish: "Spanish",
  español: "Spanish",
  espanol: "Spanish",
  vietnamese: "Vietnamese",
  "tiếng việt": "Vietnamese",
  farsi: "Farsi",
  persian: "Farsi",
  punjabi: "Punjabi",
  korean: "Korean",
  russian: "Russian",
  mandarin: "Mandarin",
  chinese: "Mandarin",
  tagalog: "Tagalog",
  filipino: "Tagalog",
  cantonese: "Cantonese",
  arabic: "Arabic",
};

/** Languages people type that INT-300 lists only under "Other". */
const OTHER_NAMES: Record<string, string> = { hmong: "Hmong", hmoob: "Hmong", mixteco: "Mixteco", mixtec: "Mixteco" };
export const otherLanguageName = (text: string) => OTHER_NAMES[text.trim().toLowerCase()] ?? text.trim();

/** Match what someone typed ("Español", "spanish") to an INT-300 language, if it is one. */
export function matchLanguage(text: string): (typeof INT300_LANGUAGES)[number] | undefined {
  return ALIASES[text.trim().toLowerCase()];
}
