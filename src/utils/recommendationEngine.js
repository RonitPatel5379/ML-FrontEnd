import { normalizeLanguage, matchesLanguage } from "../data/genres";

export const WEIGHTS = {
  genre: 0.4,
  rating: 0.25,
  popularity: 0.15,
  recent: 0.1,
  preference: 0.1,
};

const byId = (movies) => new Map(movies.map((movie) => [movie.id, movie]));

/**
 * Checks if a movie's release year matches the user's period preference.
 * Values: "2020", "2010", "2000", "classic" (<1990), "any"
 */
function matchesPeriod(year, period) {
  if (!period || period === "any") return true;
  const numYear = Number(year);
  if (!numYear) return true;
  if (period === "classic") return numYear < 1990;
  const fromYear = Number(period);
  if (!isNaN(fromYear)) return numYear >= fromYear;
  return true;
}

/**
 * Returns the count of genres on the movie that match the user's preferred genres (case-insensitive).
 */
function countMatchingGenres(movieGenres, preferredGenres) {
  if (!preferredGenres || preferredGenres.length === 0) return 0;
  if (!Array.isArray(movieGenres)) return 0;
  const lowerPrefs = preferredGenres.map((g) => g.toLowerCase());
  return movieGenres.filter((g) => lowerPrefs.includes(String(g).toLowerCase())).length;
}

/** Builds a normalized genre-affinity map from user activity and explicit preferences. */
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
      if (Array.isArray(movie.genres)) {
        movie.genres.forEach((genre) => add(genre, weight));
      }
    });
  });

  // Explicit user-chosen preferences receive strong priority in taste profile
  if (Array.isArray(preferences.genres)) {
    preferences.genres.forEach((genre) => add(genre, 6));
  }

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

function reasonFor(movie, { profile, recentMovie, preferences }) {
  const preferredGenres = Array.isArray(preferences?.genres) ? preferences.genres : [];
  const preferredLanguages = Array.isArray(preferences?.languages) ? preferences.languages : [];
  const hasPreferredGenres = preferredGenres.length > 0;
  const hasPreferredLanguages = preferredLanguages.length > 0;

  const matchedGenres = Array.isArray(movie.genres)
    ? movie.genres.filter((g) => preferredGenres.some((pg) => pg.toLowerCase() === g.toLowerCase()))
    : [];

  const canonicalMovieLang = normalizeLanguage(movie.language);

  // 1. Matched both preferred language and preferred genres
  if (
    hasPreferredLanguages &&
    hasPreferredGenres &&
    matchedGenres.length > 0 &&
    matchesLanguage(movie.language, preferredLanguages)
  ) {
    return `Matches your taste: ${canonicalMovieLang} · ${matchedGenres.slice(0, 2).join(" & ")}`;
  }

  // 2. Matched preferred genres
  if (hasPreferredGenres && matchedGenres.length > 0) {
    return `Preferred genre: ${matchedGenres.slice(0, 2).join(" & ")}`;
  }

  // 3. Matched preferred language
  if (hasPreferredLanguages && matchesLanguage(movie.language, preferredLanguages)) {
    return `Top pick in ${canonicalMovieLang}`;
  }

  // 4. Taste profile match from viewing history
  const strongest = topGenres(profile, 3).find((entry) =>
    Array.isArray(movie.genres) && movie.genres.includes(entry.genre),
  );
  if (recentMovie && Array.isArray(movie.genres) && movie.genres.some((g) => recentMovie.genres?.includes(g))) {
    return `Because you watched ${recentMovie.title}`;
  }
  if (strongest) return `Because you like ${strongest.genre}`;
  if (movie.rating >= 8.3) return "Highly rated by users like you";
  return "Trending with viewers like you";
}

/**
 * Returns [{ ...movie, score, reason }] sorted by recommendation score,
 * strictly honoring user preferences (genres, languages, period, minRating).
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

  // Extract explicit preferences
  const preferredGenres = Array.isArray(preferences.genres) ? preferences.genres.filter(Boolean) : [];
  const preferredLanguages = Array.isArray(preferences.languages) ? preferences.languages.filter(Boolean) : [];
  const minRating = Number(preferences.minRating) || 0;
  const period = preferences.period && preferences.period !== "any" ? preferences.period : null;

  const hasPreferredGenres = preferredGenres.length > 0;
  const hasPreferredLanguages = preferredLanguages.length > 0;
  const hasExplicitPreferences = hasPreferredGenres || hasPreferredLanguages || minRating > 0 || Boolean(period);

  // Filter out already seen movies
  const unseen = movies.filter((m) => !seen.has(m.id));

  // Score function for candidate movies
  const scoreMovie = (movie) => {
    const matchCount = countMatchingGenres(movie.genres, preferredGenres);
    const langMatch = matchesLanguage(movie.language, preferredLanguages);
    const periodMatch = matchesPeriod(movie.year, period);
    const ratingMatch = (movie.rating || 0) >= minRating;

    let genreScore = 0;
    if (hasPreferredGenres) {
      if (matchCount >= 3) genreScore = 1.0;
      else if (matchCount === 2) genreScore = 0.85;
      else if (matchCount === 1) genreScore = 0.65;
      else genreScore = 0;
    } else {
      genreScore =
        hasSignal && Array.isArray(movie.genres)
          ? movie.genres.reduce((sum, g) => sum + (profile[g] || 0), 0)
          : 0.4;
    }

    const ratingScore = Math.min(Math.max((movie.rating || 0) / 10, 0), 1);
    const popularityScore = (movie.popularity || 0) / maxPopularity;
    const recentScore =
      recentMovie && Array.isArray(movie.genres) && movie.genres.some((g) => recentMovie.genres?.includes(g))
        ? 1
        : 0.2;

    const searchBoost = searchTerms.some(
      (term) =>
        movie.title?.toLowerCase().includes(term) ||
        (Array.isArray(movie.genres) && movie.genres.some((g) => g.toLowerCase().includes(term))),
    )
      ? 0.05
      : 0;

    let finalScore = 0;
    if (hasExplicitPreferences) {
      // Dynamic weighted scoring emphasizing preferred attributes
      const langBonus = hasPreferredLanguages ? (langMatch ? 0.35 : -1.0) : 0;
      const genreBonus = hasPreferredGenres ? (matchCount > 0 ? 0.35 * genreScore : -1.0) : 0;
      const periodBonus = period ? (periodMatch ? 0.10 : -0.2) : 0.05;
      const ratingBonus = minRating > 0 ? (ratingMatch ? 0.10 : -0.2) : 0.05;

      finalScore =
        langBonus +
        genreBonus +
        periodBonus +
        ratingBonus +
        0.15 * ratingScore +
        0.05 * popularityScore +
        searchBoost;
    } else {
      finalScore =
        WEIGHTS.genre * Math.min(genreScore * 2, 1) +
        WEIGHTS.rating * ratingScore +
        WEIGHTS.popularity * popularityScore +
        WEIGHTS.recent * recentScore +
        searchBoost;
    }

    return {
      ...movie,
      score: Number(finalScore.toFixed(4)),
      reason: reasonFor(movie, { profile, recentMovie, preferences }),
    };
  };

  // When user has explicit preferences, enforce strict prioritized selection
  if (hasExplicitPreferences) {
    const selectedIds = new Set();
    const result = [];

    const addBatch = (candidates) => {
      const scoredBatch = candidates
        .filter((m) => !selectedIds.has(m.id))
        .map(scoreMovie)
        .sort((a, b) => b.score - a.score);

      for (const item of scoredBatch) {
        if (result.length >= limit) break;
        selectedIds.add(item.id);
        result.push(item);
      }
    };

    // Tier 1: Strict full match (language + genre + period + rating)
    const tier1 = unseen.filter((m) => {
      const langOk = hasPreferredLanguages ? matchesLanguage(m.language, preferredLanguages) : true;
      const genreOk = hasPreferredGenres ? countMatchingGenres(m.genres, preferredGenres) > 0 : true;
      const periodOk = period ? matchesPeriod(m.year, period) : true;
      const ratingOk = minRating > 0 ? (m.rating || 0) >= minRating : true;
      return langOk && genreOk && periodOk && ratingOk;
    });
    addBatch(tier1);

    // Tier 2: Core match (strictly language + genre; relax period/rating if needed)
    if (result.length < limit && (hasPreferredLanguages || hasPreferredGenres)) {
      const tier2 = unseen.filter((m) => {
        const langOk = hasPreferredLanguages ? matchesLanguage(m.language, preferredLanguages) : true;
        const genreOk = hasPreferredGenres ? countMatchingGenres(m.genres, preferredGenres) > 0 : true;
        return langOk && genreOk;
      });
      addBatch(tier2);
    }

    // Tier 3: Strict language match (if language preference was specified)
    if (result.length < limit && hasPreferredLanguages) {
      const tier3 = unseen.filter((m) => matchesLanguage(m.language, preferredLanguages));
      addBatch(tier3);
    }

    // Tier 4: Strict genre match (if only genres were specified)
    if (result.length < limit && hasPreferredGenres && !hasPreferredLanguages) {
      const tier4 = unseen.filter((m) => countMatchingGenres(m.genres, preferredGenres) > 0);
      addBatch(tier4);
    }

    // Fallback: fill remaining if catalog pool is small
    if (result.length < limit) {
      addBatch(unseen);
    }

    return result.slice(0, limit);
  }

  // No explicit preferences: standard recommendation scoring
  const scored = unseen.map(scoreMovie).sort((a, b) => b.score - a.score);
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
