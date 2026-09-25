/**
 * CineVerse Hub - ML Backend Service
 * Communicates with the FastAPI Recommendation API running on Render.
 *
 * Field mapping (backend → frontend):
 *   vote_average     → rating
 *   release_year     → year
 *   original_language → language
 *   poster_path      → remotePoster
 *   genres (string)  → genres (array)
 */

import { API_CONFIG } from "../config/api";
import { normalizeLanguage } from "../data/genres";

// ─── Normalizer ──────────────────────────────────────────────────────────────

/**
 * Maps a raw backend movie object to the standard frontend Movie shape.
 * Works for /movies list items, /movies/{id} detail objects, /search results,
 * and recommendation objects inside /predict responses.
 *
 * @param {Object} raw   - Raw object from the backend
 * @param {number} [idx] - Fallback index used when raw.id is missing
 * @returns {Object}     - Normalised frontend Movie object
 */
export function normalizeMlMovie(raw, idx = 0) {
  if (!raw) return null;

  // ── Genres: backend sends a comma-separated string ──────────────────────
  const genreArray =
    typeof raw.genres === "string"
      ? raw.genres
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean)
          .map((g) => (g === "Science Fiction" ? "Sci-Fi" : g))
      : Array.isArray(raw.genres)
        ? raw.genres.map((g) => (g === "Science Fiction" ? "Sci-Fi" : g))
        : [];

  // ── Year ────────────────────────────────────────────────────────────────
  const year =
    raw.release_year ||
    raw.year ||
    Number(String(raw.release_date || "").slice(0, 4)) ||
    0;

  // ── Rating (backend: vote_average, 0–10) ────────────────────────────────
  const rating = Number(
    (typeof raw.vote_average === "number" ? raw.vote_average : raw.rating ?? 0).toFixed(1),
  );

  // ── Poster URL ──────────────────────────────────────────────────────────
  let remotePoster = raw.poster_path || raw.remotePoster || null;
  if (
    remotePoster &&
    typeof remotePoster === "string" &&
    remotePoster.startsWith("/") &&
    !remotePoster.startsWith("//")
  ) {
    remotePoster = `https://image.tmdb.org/t/p/w500${remotePoster}`;
  }

  // ── Language ────────────────────────────────────────────────────────────
  const rawLang = raw.original_language || raw.language || "en";
  const language = normalizeLanguage(rawLang);

  // ── Similarity badge (recommendations only) ─────────────────────────────
  const similarityText =
    raw.similarity != null ? `${raw.similarity}% Match` : undefined;
  const reasonText =
    raw.similarity != null ? `ML Match: ${raw.similarity}%` : undefined;

  return {
    // Identifiers
    id: raw.id ?? idx,
    title: raw.title || raw.original_title || "Untitled",

    // Core metadata
    year,
    rating,
    runtime: raw.runtime || 0,
    genres: genreArray,
    overview: raw.overview || "",
    language,
    certification: raw.certification || "PG-13",

    // Popularity / engagement
    popularity: typeof raw.popularity === "number" ? Math.round(raw.popularity) : 0,
    voteCount: raw.vote_count || 0,

    // Financials
    budget: raw.budget || 0,
    revenue: raw.revenue || 0,

    // Visual
    remotePoster,
    hue: ((raw.id ?? idx) * 37) % 360,
    backdrop: "neon",

    // Recommendation metadata (only set on /predict results)
    ...(similarityText !== undefined && { similarity: similarityText }),
    ...(reasonText !== undefined && { reason: reasonText, isMlRecommendation: true }),
  };
}

// ─── Connection & Keep-Alive State ──────────────────────────────────────────
let backendOnline = false;
let isWarmingUp = false;
let heartbeatTimer = null;
let lastSuccessfulPing = 0;
const statusListeners = new Set();

export function isBackendOnline() {
  return backendOnline;
}

export function subscribeBackendStatus(listener) {
  statusListeners.add(listener);
  try {
    listener({ online: backendOnline, lastPing: lastSuccessfulPing, warmingUp: isWarmingUp });
  } catch {}
  return () => statusListeners.delete(listener);
}

function notifyStatus() {
  const state = { online: backendOnline, lastPing: lastSuccessfulPing, warmingUp: isWarmingUp };
  statusListeners.forEach((l) => {
    try {
      l(state);
    } catch (e) {
      console.warn("[ML API] Status listener error:", e);
    }
  });
}

/**
 * Starts a 4-minute recurring heartbeat ping.
 * Prevents Render from spinning down free containers due to inactivity.
 */
export function startBackendHeartbeat() {
  if (typeof window === "undefined") return;
  if (heartbeatTimer) return; // already active

  const ping = async () => {
    try {
      const { signal, clear } = makeController(API_CONFIG.warmProbeTimeoutMs || 8000);
      const res = await fetch(`${API_CONFIG.backendUrl}${API_CONFIG.endpoints.health}`, {
        signal,
        cache: "no-store",
      });
      clear();
      if (res.ok) {
        backendOnline = true;
        lastSuccessfulPing = Date.now();
        notifyStatus();
      } else {
        void warmupBackend(2);
      }
    } catch {
      void warmupBackend(2);
    }
  };

  heartbeatTimer = setInterval(ping, API_CONFIG.heartbeatIntervalMs || 240000);

  // Ping immediately when window regains focus if > 2 minutes since last ping
  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      const elapsed = Date.now() - lastSuccessfulPing;
      if (elapsed > 2 * 60 * 1000) {
        void ping();
      }
    }
  };

  window.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("focus", handleVisibility);
}

/**
 * Proactively wakes up the Render backend container.
 * Uses generous timeouts and retries so cold-starts connect automatically
 * without requiring the user to reload 2-3 times.
 */
export async function warmupBackend(maxRetries = 3) {
  if (isWarmingUp) return backendOnline;
  isWarmingUp = true;
  notifyStatus();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const timeout = attempt === 1 ? 30000 : 25000;
    const { signal, clear } = makeController(timeout);
    try {
      const response = await fetch(`${API_CONFIG.backendUrl}${API_CONFIG.endpoints.health}`, {
        signal,
        cache: "no-store",
      });
      if (response.ok) {
        backendOnline = true;
        lastSuccessfulPing = Date.now();
        isWarmingUp = false;
        notifyStatus();
        startBackendHeartbeat();
        clear();
        return true;
      }
    } catch (err) {
      console.warn(`[ML API] Warmup attempt ${attempt}/${maxRetries} waiting for container:`, err?.message);
    } finally {
      clear();
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }

  isWarmingUp = false;
  notifyStatus();
  return backendOnline;
}

/**
 * Called immediately upon login or app launch to guarantee the live API is connected
 * and remains connected with an active heartbeat.
 */
export async function ensureLiveApiConnected() {
  startBackendHeartbeat();
  if (!backendOnline && !isWarmingUp) {
    return await warmupBackend(3);
  }
  return backendOnline;
}

// Auto-start heartbeat and background warmup as soon as script loads in browser
if (typeof window !== "undefined") {
  setTimeout(() => {
    startBackendHeartbeat();
    void warmupBackend(2);
  }, 100);
}

// ─── API helpers ─────────────────────────────────────────────────────────────

function makeController(ms = API_CONFIG.timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

// ─── In-memory caches for fast sub-millisecond responses ──────────────────────
const catalogCache = new Map();
const movieDetailCache = new Map();
const searchCache = new Map();

// ─── Catalog: paginated /movies ──────────────────────────────────────────────

/**
 * Fetches a page of movies from the backend catalog (/movies) with in-memory caching.
 * @param {{ page?, limit?, genre?, sortBy?, search?, minRating?, language? }} opts
 * @returns {Promise<{ total, page, totalPages, results: Movie[] }|null>}
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
  const cacheKey = `${page}_${limit}_${genre}_${sortBy}_${search.trim().toLowerCase()}_${minRating}_${language}`;
  if (catalogCache.has(cacheKey)) {
    return catalogCache.get(cacheKey);
  }

  const { signal, clear } = makeController();
  try {
    const url = new URL(`${API_CONFIG.backendUrl}${API_CONFIG.endpoints.movies}`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("sort_by", sortBy);
    if (genre) url.searchParams.set("genre", genre);
    if (search) url.searchParams.set("search", search);
    if (minRating > 0) url.searchParams.set("min_rating", String(minRating));
    if (language) url.searchParams.set("language", language);

    const response = await fetch(url.toString(), { signal });
    if (!response.ok) return null;
    const data = await response.json();
    const result = {
      total: data.total || 0,
      page: data.page || page,
      totalPages: data.total_pages || 1,
      results: (data.results || []).map((m, i) => normalizeMlMovie(m, i)),
    };
    catalogCache.set(cacheKey, result);
    backendOnline = true;
    lastSuccessfulPing = Date.now();
    notifyStatus();
    return result;
  } catch {
    return null;
  } finally {
    clear();
  }
}

// ─── Single movie detail: /movies/{id} ───────────────────────────────────────

/**
 * Fetches full details for a movie by ID with in-memory caching.
 * @param {string|number} id
 * @returns {Promise<Movie|null>}
 */
export async function fetchMlMovieById(id) {
  if (!id) return null;
  const cacheKey = String(id);
  if (movieDetailCache.has(cacheKey)) {
    return movieDetailCache.get(cacheKey);
  }

  const { signal, clear } = makeController();
  try {
    const url = `${API_CONFIG.backendUrl}${API_CONFIG.endpoints.movieById(id)}`;
    const response = await fetch(url, { signal });
    if (!response.ok) return null;
    const raw = await response.json();
    const normalized = normalizeMlMovie(raw);
    if (normalized) {
      movieDetailCache.set(cacheKey, normalized);
    }
    return normalized;
  } catch {
    return null;
  } finally {
    clear();
  }
}

// ─── Search: /search ─────────────────────────────────────────────────────────

/**
 * Searches movie titles across the full 69,405-movie dataset with caching.
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Movie[]>}
 */
export async function searchMlMovies(query, limit = 15) {
  if (!query?.trim()) return [];
  const cacheKey = `${query.trim().toLowerCase()}_${limit}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  const { signal, clear } = makeController();
  try {
    const url = new URL(`${API_CONFIG.backendUrl}${API_CONFIG.endpoints.search}`);
    url.searchParams.set("q", query.trim());
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), { signal });
    if (!response.ok) return [];
    const data = await response.json();
    const results = (data.results || []).map((m, i) => normalizeMlMovie(m, i));
    searchCache.set(cacheKey, results);
    return results;
  } catch {
    return [];
  } finally {
    clear();
  }
}

// ─── Recommendations: POST /predict ──────────────────────────────────────────

// In-memory cache for ML recommendations to avoid repeated calls for the same movie
const mlRecsCache = new Map();

/**
 * Fetches ML-powered recommendations for a movie title.
 * @param {string} movieTitle
 * @param {number} n
 * @param {Movie[]} localMovies  - Optional local catalog to enrich results
 * @returns {Promise<Movie[]>}
 */
export async function fetchMlRecommendations(movieTitle, n = 12, localMovies = []) {
  if (!movieTitle || typeof movieTitle !== "string") return [];

  const normalizedTitle = movieTitle.trim();
  const cacheKey = `${normalizedTitle.toLowerCase()}_${n}`;

  if (mlRecsCache.has(cacheKey)) {
    const cached = mlRecsCache.get(cacheKey);
    // Enrich with any newly loaded localMovies if available
    if (localMovies && localMovies.length > 0) {
      return cached.map((rec) => {
        const localMatch = localMovies.find(
          (m) =>
            String(m.id) === String(rec.id) ||
            m.title?.toLowerCase() === rec.title?.toLowerCase(),
        );
        return localMatch
          ? {
              ...localMatch,
              reason: rec.reason || "ML Recommendation",
              similarity: rec.similarity,
              isMlRecommendation: true,
            }
          : rec;
      });
    }
    return cached;
  }

  const { signal, clear } = makeController();
  try {
    const url = `${API_CONFIG.backendUrl}${API_CONFIG.endpoints.predict}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: normalizedTitle, n: Math.min(Math.max(1, n), 50) }),
      signal,
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data?.recommendations)) return [];

    const results = data.recommendations.map((item, idx) => {
      const normalized = normalizeMlMovie(item, idx + 1);
      // If the movie exists in local catalog, prefer its richer data
      const localMatch = localMovies.find(
        (m) =>
          String(m.id) === String(normalized.id) ||
          m.title?.toLowerCase() === normalized.title?.toLowerCase(),
      );
      if (localMatch) {
        return {
          ...localMatch,
          reason: normalized.reason || "ML Recommendation",
          similarity: normalized.similarity,
          isMlRecommendation: true,
        };
      }
      return normalized;
    });

    if (results.length > 0) {
      mlRecsCache.set(cacheKey, results);
    }
    return results;
  } catch (err) {
    console.warn(`[ML API] Recommendations failed for "${movieTitle}":`, err?.message);
    return [];
  } finally {
    clear();
  }
}

// ─── Health: /health ─────────────────────────────────────────────────────────

/**
 * Checks backend health and reports model status.
 * @returns {Promise<{ online: boolean, modelReady: boolean, totalMovies: number }>}
 */
export async function checkBackendHealth() {
  const { signal, clear } = makeController(API_CONFIG.warmProbeTimeoutMs || 8000);
  try {
    const url = `${API_CONFIG.backendUrl}${API_CONFIG.endpoints.health}`;
    const response = await fetch(url, { signal, cache: "no-store" });
    if (!response.ok) return { online: false, modelReady: false, totalMovies: 0 };
    const data = await response.json();
    backendOnline = true;
    lastSuccessfulPing = Date.now();
    notifyStatus();
    return {
      online: true,
      modelReady: Boolean(data?.model_loaded),
      totalMovies: data?.total_movies || 0,
    };
  } catch {
    return { online: false, modelReady: false, totalMovies: 0 };
  } finally {
    clear();
  }
}

// ─── Genres: /genres ─────────────────────────────────────────────────────────

/**
 * Fetches all genres and their movie counts from the backend.
 * @returns {Promise<Array<{ name: string, count: number }>>}
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
