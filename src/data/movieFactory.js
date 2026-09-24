/**
 * Shared movie factory. Keeps every dataset (global + Indian) on the exact
 * same shape as the TMDB-style response returned by src/services/movieApi.js.
 */
export const makeMovie = (
  id,
  title,
  year,
  rating,
  runtime,
  genres,
  overview,
  director,
  cast,
  extra = {},
) => ({
  id,
  title,
  year,
  rating,
  runtime,
  genres,
  overview,
  director,
  cast,
  language: extra.language || "English",
  certification: extra.certification || "PG-13",
  popularity: extra.popularity ?? Math.round(rating * 10 + (year - 1990)),
  writers: extra.writers || [director],
  companies: extra.companies || ["Aurora Pictures", "Northlight Studios"],
  budget: extra.budget ?? 90_000_000,
  revenue: extra.revenue ?? 420_000_000,
  hue: extra.hue ?? (id * 37) % 360,
  backdrop: extra.backdrop || "space",
  tagline: extra.tagline || "",
  region: extra.region || "global",
  remotePoster: extra.remotePoster || `/posters/${id}.jpg`,
});

export default makeMovie;
