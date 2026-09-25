/** Canonical genre list used across the app (TMDB-compatible ids). */
export const GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
];

export const GENRE_NAMES = GENRES.map((g) => g.name);

export const LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Kannada",
  "Bengali",
  "Marathi",
  "Japanese",
  "Korean",
  "French",
  "Spanish",
  "German",
];


/** slugify("Sci-Fi") -> "sci-fi" */
export const genreSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export const genreFromSlug = (slug) =>
  GENRE_NAMES.find((name) => genreSlug(name) === String(slug).toLowerCase()) || null;

export const LANGUAGE_CODE_TO_NAME = {
  en: "English",
  eng: "English",
  english: "English",
  hi: "Hindi",
  hin: "Hindi",
  hindi: "Hindi",
  ta: "Tamil",
  tam: "Tamil",
  tamil: "Tamil",
  te: "Telugu",
  tel: "Telugu",
  telugu: "Telugu",
  ml: "Malayalam",
  mal: "Malayalam",
  malayalam: "Malayalam",
  kn: "Kannada",
  kan: "Kannada",
  kannada: "Kannada",
  bn: "Bengali",
  ben: "Bengali",
  bengali: "Bengali",
  mr: "Marathi",
  mar: "Marathi",
  marathi: "Marathi",
  ja: "Japanese",
  jpn: "Japanese",
  japanese: "Japanese",
  ko: "Korean",
  kor: "Korean",
  korean: "Korean",
  fr: "French",
  fra: "French",
  fre: "French",
  french: "French",
  es: "Spanish",
  spa: "Spanish",
  spanish: "Spanish",
  de: "German",
  deu: "German",
  ger: "German",
  german: "German",
  it: "Italian",
  ita: "Italian",
  italian: "Italian",
  zh: "Chinese",
  zho: "Chinese",
  chi: "Chinese",
  chinese: "Chinese",
  ru: "Russian",
  rus: "Russian",
  russian: "Russian",
  pt: "Portuguese",
  por: "Portuguese",
  portuguese: "Portuguese",
};

/** Normalizes any language code (e.g. "hi", "en", "ko") or name to canonical display format ("Hindi", "English", "Korean") */
export function normalizeLanguage(lang) {
  if (!lang || typeof lang !== "string") return "English";
  const clean = lang.trim().toLowerCase();
  if (LANGUAGE_CODE_TO_NAME[clean]) return LANGUAGE_CODE_TO_NAME[clean];
  const found = LANGUAGES.find((l) => l.toLowerCase() === clean);
  if (found) return found;
  return lang.charAt(0).toUpperCase() + lang.slice(1);
}

/** Checks whether a movie's language matches any of the user's preferred languages */
export function matchesLanguage(movieLang, targetLanguages) {
  if (!targetLanguages || targetLanguages.length === 0) return true;
  if (!movieLang) return false;
  const canonicalMovie = normalizeLanguage(movieLang).toLowerCase();
  return targetLanguages.some((target) => {
    const canonicalTarget = normalizeLanguage(target).toLowerCase();
    return canonicalMovie === canonicalTarget || String(movieLang).toLowerCase() === String(target).toLowerCase();
  });
}

