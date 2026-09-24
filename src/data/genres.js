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
