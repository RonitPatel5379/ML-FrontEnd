/**
 * CineVerse recommendation engine — pure JavaScript, zero UI dependencies.
 *
 * Score weights:
 *   Genre match      40%
 *   Rating           25%
 *   Popularity       15%
 *   Recent activity  10%
 *   Preference match 10%
 */

export const WEIGHTS = {
  genre: 0.4,
  rating: 0.25,
  popularity: 0.15,
  recent: 0.1,
  preference: 0.1,
};

const byId = (movies) => new Map(movies.map((movie) => [movie.id, movie]));

/** Builds a normalized genre-affinity map from everything we know about the user. */
export function buildTasteProfile({
  movies = [],
  favorites = [],
  watchlist = [],
  recent = [],
  watched = [],
  preferences = {},
} = {}) {
  const lookup = byId(movies);
  const weightsBySource = [
    { ids: favorites, weight: 3 },
    { ids: watched, weight: 3 },
    { ids: recent.map((entry) => entry.id ?? entry), weight: 2.5 },
    { ids: watchlist, weight: 1.5 },
  ];

  const affinity = {};
  const add = (genre, amount) => {
    affinity[genre] = (affinity[genre] || 0) + amount;
  };

  weightsBySource.forEach(({ ids, weight }) => {
    ids.forEach((id) => {
      const movie = lookup.get(id);
      if (!movie) return;
      movie.genres.forEach((genre) => add(genre, weight));
    });
  });

  (preferences.genres || []).forEach((genre) => add(genre, 2));

  const total = Object.values(affinity).reduce((sum, n) => sum + n, 0) || 1;
  const normalized = {};
  Object.entries(affinity).forEach(([genre, value]) => {
    normalized[genre] = value / total;
  });
  return normalized;
}

/** Sorted [{ genre, share }] used by the profile page visualization. */
export function topGenres(profile, limit = 5) {
  return Object.entries(profile)
    .map(([genre, share]) => ({ genre, share: Math.round(share * 100) }))
    .sort((a, b) => b.share - a.share)
    .slice(0, limit);
}

function preferenceScore(movie, preferences) {
  let score = 0;
  let checks = 0;

  if (preferences.minRating) {
    checks += 1;
    if (movie.rating >= preferences.minRating) score += 1;
  }
  if (preferences.languages?.length) {
    checks += 1;
    if (preferences.languages.includes(movie.language)) score += 1;
  }
  if (preferences.period && preferences.period !== "any") {
    checks += 1;
    const from = Number(preferences.period);
    if (movie.year >= from) score += 1;
  }
  return checks ? score / checks : 0.5;
}

function reasonFor(movie, { profile, recentMovie, preferences }) {
  const strongest = topGenres(profile, 3).find((entry) =>
    movie.genres.includes(entry.genre),
  );
  if (recentMovie && recentMovie.genres.some((g) => movie.genres.includes(g))) {
    return `Because you watched ${recentMovie.title}`;
  }
  if (strongest) return `Because you like ${strongest.genre}`;
  if (movie.rating >= 8.3) return "Highly rated by users like you";
  if (preferences.languages?.includes(movie.language)) {
    return `Popular in ${movie.language}`;
  }
  return "Trending with viewers like you";
}

/**
 * Returns [{ ...movie, score, reason }] sorted by recommendation score.
 */
export function recommendMovies({
  movies = [],
  favorites = [],
  watchlist = [],
  recent = [],
  watched = [],
  preferences = {},
  searches = [],
  limit = 20,
  excludeSeen = true,
} = {}) {
  const profile = buildTasteProfile({
    movies,
    favorites,
    watchlist,
    recent,
    watched,
    preferences,
  });
  const hasSignal = Object.keys(profile).length > 0;
  const lookup = byId(movies);
  const recentIds = recent.map((entry) => entry.id ?? entry);
  const recentMovie = lookup.get(recentIds[0]);
  const seen = new Set([
    ...favorites,
    ...recentIds,
    ...(excludeSeen ? (watched || []) : []),
  ]);
  const searchTerms = searches.map((term) => String(term).toLowerCase());

  const maxPopularity =
    movies.reduce((max, movie) => Math.max(max, movie.popularity || 0), 0) || 1;

  const scored = movies
    .filter((movie) => !seen.has(movie.id))
    .map((movie) => {
      const genreScore = hasSignal
        ? movie.genres.reduce((sum, genre) => sum + (profile[genre] || 0), 0)
        : 0.4;
      const ratingScore = Math.min(movie.rating / 10, 1);
      const popularityScore = (movie.popularity || 0) / maxPopularity;
      const recentScore =
        recentMovie && recentMovie.genres.some((g) => movie.genres.includes(g))
          ? 1
          : 0.2;
      const prefScore = preferenceScore(movie, preferences);
      const searchBoost = searchTerms.some(
        (term) =>
          movie.title.toLowerCase().includes(term) ||
          movie.genres.some((g) => g.toLowerCase().includes(term)),
      )
        ? 0.05
        : 0;

      const score =
        WEIGHTS.genre * Math.min(genreScore * 2, 1) +
        WEIGHTS.rating * ratingScore +
        WEIGHTS.popularity * popularityScore +
        WEIGHTS.recent * recentScore +
        WEIGHTS.preference * prefScore +
        searchBoost;

      return {
        ...movie,
        score: Number(score.toFixed(4)),
        reason: reasonFor(movie, { profile, recentMovie, preferences }),
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

/** Content-based "similar movies" for the details page. */
export function similarMovies(movie, movies, limit = 10) {
  if (!movie) return [];
  return movies
    .filter((candidate) => candidate.id !== movie.id)
    .map((candidate) => {
      const shared = candidate.genres.filter((g) => movie.genres.includes(g)).length;
      const sameDirector = candidate.director === movie.director ? 1 : 0;
      const ratingCloseness = 1 - Math.min(Math.abs(candidate.rating - movie.rating) / 3, 1);
      return {
        ...candidate,
        score: shared * 0.55 + sameDirector * 0.25 + ratingCloseness * 0.2,
      };
    })
    .filter((candidate) => candidate.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
