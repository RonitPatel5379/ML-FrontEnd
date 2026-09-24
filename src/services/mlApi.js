/**
 * CineVerse Hub - ML Backend Service
 * Communicates with the FastAPI Recommendation API running on Render
 */

import { API_CONFIG } from "../config/api";

/**
 * Maps a recommendation object from the Python ML backend to frontend Movie shape
 */
function mapMlMovie(raw, fallbackId = 0, localMovies = []) {
  const rawTitle = raw.title || raw.original_title || "Unknown Title";
  const localMatch = localMovies.find(
    (m) => m.title?.toLowerCase() === rawTitle.toLowerCase() || String(m.id) === String(raw.id),
  );

  const similarityText = raw.similarity != null ? `${raw.similarity}% Match` : undefined;
  const reasonText =
    raw.similarity != null ? `ML Match: ${raw.similarity}%` : "Backend AI Recommendation";

  if (localMatch) {
    return {
      ...localMatch,
      reason: reasonText,
      similarity: similarityText,
      isMlRecommendation: true,
    };
  }

  const genres =
    typeof raw.genres === "string"
      ? raw.genres.split(",").map((g) => g.trim())
      : Array.isArray(raw.genres)
        ? raw.genres
        : [];

  const year =
    raw.release_year ||
    Number(String(raw.release_date || "").slice(0, 4)) ||
    new Date().getFullYear();

  const rating = Number((typeof raw.vote_average === "number" ? raw.vote_average : 7.0).toFixed(1));

  return {
    id: raw.id || fallbackId,
    title: rawTitle,
    year,
    rating,
    runtime: raw.runtime || 120,
    genres,
    overview: raw.overview || "No overview available for this title.",
    remotePoster: raw.poster_path || null,
    popularity: Math.round(raw.popularity || 0),
    similarity: similarityText,
    reason: reasonText,
    isMlRecommendation: true,
  };
}

/**
 * Fetches top N machine learning recommendations for a movie title
 * @param {string} movieTitle
 * @param {number} n
 * @param {Array} localMovies
 * @returns {Promise<Array>}
 */
export async function fetchMlRecommendations(movieTitle, n = 12, localMovies = []) {
  if (!movieTitle || typeof movieTitle !== "string") return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

  try {
    const url = `${API_CONFIG.backendUrl}${API_CONFIG.endpoints.predict}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: movieTitle.trim(),
        n: Math.min(Math.max(1, n), 50),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`[ML API] Request returned status ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (data?.recommendations && Array.isArray(data.recommendations)) {
      return data.recommendations.map((item, idx) => mapMlMovie(item, idx + 1, localMovies));
    }
    return [];
  } catch (err) {
    console.warn(
      `[ML API] Failed to fetch recommendations for "${movieTitle}":`,
      err?.message || err,
    );
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Searches movie titles in the ML backend dataset
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array<string>>}
 */
export async function searchMlMovies(query, limit = 10) {
  if (!query || query.trim().length === 0) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

  try {
    const url = new URL(`${API_CONFIG.backendUrl}${API_CONFIG.endpoints.search}`);
    url.searchParams.set("q", query.trim());
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data?.results || [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Checks connectivity and health status of the Render ML backend
 * @returns {Promise<{ online: boolean, modelReady: boolean, totalMovies: number }>}
 */
export async function checkBackendHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const url = `${API_CONFIG.backendUrl}${API_CONFIG.endpoints.health}`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return { online: false, modelReady: false, totalMovies: 0 };
    const data = await response.json();
    return {
      online: true,
      modelReady: Boolean(data?.model_loaded),
      totalMovies: data?.total_movies || 0,
    };
  } catch {
    return { online: false, modelReady: false, totalMovies: 0 };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetches full details for a specific movie from the 69,405 backend dataset
 * @param {string|number} id
 * @returns {Promise<Object|null>}
 */
export async function fetchMlMovieById(id) {
  if (!id) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

  try {
    const url = `${API_CONFIG.backendUrl}${API_CONFIG.endpoints.movieById(id)}`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const raw = await response.json();
    return mapMlMovie(raw);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Paginated movie catalog from the 69,405 dataset with filters
 */
export async function fetchMlCatalog({
  page = 1,
  limit = 24,
  genre = "",
  sortBy = "popularity",
  search = "",
  minRating = 0,
  language = "",
} = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

  try {
    const url = new URL(`${API_CONFIG.backendUrl}${API_CONFIG.endpoints.movies}`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("sort_by", sortBy);
    if (genre) url.searchParams.set("genre", genre);
    if (search) url.searchParams.set("search", search);
    if (minRating > 0) url.searchParams.set("min_rating", String(minRating));
    if (language) url.searchParams.set("language", language);

    const response = await fetch(url.toString(), { signal: controller.signal });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      total: data.total || 0,
      page: data.page || page,
      totalPages: data.total_pages || 1,
      results: (data.results || []).map((m, idx) => mapMlMovie(m, idx + 1)),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetches genre counts across the full dataset
 */
export async function fetchMlGenres() {
  try {
    const url = `${API_CONFIG.backendUrl}${API_CONFIG.endpoints.genres}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.genres || [];
  } catch {
    return [];
  }
}

