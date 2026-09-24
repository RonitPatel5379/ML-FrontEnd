/**
 * CineVerse Hub - ML Backend Service
 * Communicates with the FastAPI Recommendation API running on Render
 */

import { API_CONFIG } from "../config/api";

/**
 * Maps a recommendation object from the Python ML backend to frontend Movie shape
 */
function mapMlMovie(raw, fallbackId = 0) {
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
    title: raw.title || raw.original_title || "Unknown Title",
    year,
    rating,
    runtime: raw.runtime || 120,
    genres,
    overview: raw.overview || "No overview available for this title.",
    remotePoster: raw.poster_path || null,
    popularity: Math.round(raw.popularity || 0),
    similarity: raw.similarity != null ? `${raw.similarity}% Match` : undefined,
    isMlRecommendation: true,
  };
}

/**
 * Fetches top N machine learning recommendations for a movie title
 * @param {string} movieTitle
 * @param {number} n
 * @returns {Promise<Array>}
 */
export async function fetchMlRecommendations(movieTitle, n = 12) {
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
      return data.recommendations.map((item, idx) => mapMlMovie(item, idx + 1));
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
