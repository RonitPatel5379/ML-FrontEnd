/**
 * MovieContext — Backend-first movie catalog provider.
 *
 * Data loading strategy:
 *  1. Immediately populate with local curated movies (instant paint).
 *  2. Fetch page 1 from the ML backend → replace catalog with real data.
 *  3. Background-stream remaining pages so the full 69,405 movie dataset
 *     is eventually available for local filtering / recommendations.
 *
 * All backend objects are normalised through normalizeMlMovie() so every
 * consumer (MovieCard, movie.$id, SearchOverlay, etc.) receives a consistent
 * frontend Movie shape regardless of where the data originates.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { MOVIES } from "../data/movies";
import { GENRE_NAMES } from "../data/genres";
import { normalizeMlMovie, fetchMlMovieById, fetchMlCatalog, searchMlMovies } from "../services/mlApi";
import { matchesQuery } from "../utils/helpers";

const MovieContext = createContext(null);

// Pages to load on initial paint (fast first experience)
const INITIAL_PAGES = 2;
const PAGE_SIZE = 60;

export function MovieProvider({ children }) {
  const [movies, setMovies] = useState(MOVIES); // instant paint with local data
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [totalCount, setTotalCount] = useState(MOVIES.length);
  const [error, setError] = useState(null);

  // Keep a stable Map for dedup — keyed by String(id)
  const movieMap = useRef(new Map(MOVIES.map((m) => [String(m.id), m])));

  /**
   * Merges new backend records into the stable map.
   * Local curated data is NOT overwritten so rich descriptions are preserved.
   */
  const mergeInto = useCallback((records) => {
    let changed = false;
    for (const m of records) {
      const key = String(m.id);
      const existing = movieMap.current.get(key);
      if (!existing) {
        movieMap.current.set(key, m);
        changed = true;
      } else if (
        m.overview &&
        m.overview.length > 20 &&
        (!existing.overview || existing.overview.startsWith("Explore full"))
      ) {
        movieMap.current.set(key, { ...existing, ...m });
        changed = true;
      }
    }
    if (changed) {
      setMovies(Array.from(movieMap.current.values()));
    }
  }, []);

  // ── Load initial top popular pages smoothly without blocking ────────────
  const loadInitialPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const first = await fetchMlCatalog({ page: 1, limit: PAGE_SIZE, sortBy: "popularity" });
      if (!first) throw new Error("Backend unreachable — showing local catalog.");

      setTotalCount(first.total);
      mergeInto(first.results);
      setBackendReady(true);

      // Load 2nd page in parallel for rich catalog variety
      const remaining = Math.min(INITIAL_PAGES - 1, first.totalPages - 1);
      if (remaining > 0) {
        const promises = Array.from({ length: remaining }, (_, i) =>
          fetchMlCatalog({ page: i + 2, limit: PAGE_SIZE, sortBy: "popularity" }),
        );
        const pages = await Promise.all(promises);
        pages.forEach((p) => p && mergeInto(p.results));
      }
    } catch (err) {
      console.warn("[MovieContext] Backend init failed, using local catalog:", err?.message);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [mergeInto]);

  useEffect(() => {
    loadInitialPages();
  }, [loadInitialPages]);

  // ── On-demand: fetch a single movie by ID with memory cache ─────────────
  const fetchMovieById = useCallback(
    async (id) => {
      if (!id) return null;
      const key = String(id);
      const existing = movieMap.current.get(key);
      // Return early if we already have a real overview
      if (
        existing &&
        existing.overview &&
        !existing.overview.startsWith("Explore full") &&
        existing.overview.length > 20
      ) {
        return existing;
      }
      try {
        const details = await fetchMlMovieById(id);
        if (details) {
          const merged = { ...(existing || {}), ...details };
          movieMap.current.set(key, merged);
          return merged;
        }
      } catch {
        // fall through
      }
      return existing || null;
    },
    [],
  );

  // ── Search across loaded catalog + backend ───────────────────────────────
  const searchCatalog = useCallback(async (query) => {
    if (!query?.trim()) return [];
    const q = query.trim();

    // 1. Instant local match
    const local = Array.from(movieMap.current.values())
      .filter((m) => matchesQuery(m, q))
      .slice(0, 20);

    // 2. Backend deep search
    try {
      const backendResults = await searchMlMovies(q, 20);
      if (backendResults?.length) {
        const map = new Map(local.map((m) => [String(m.id), m]));
        backendResults.forEach((m) => {
          if (!map.has(String(m.id))) map.set(String(m.id), m);
        });
        return Array.from(map.values());
      }
    } catch {
      // fall through
    }
    return local;
  }, []);

  // Compute genre counts in a single O(N) pass instead of 19 full-array scans
  const genreCounts = useMemo(() => {
    const counts = {};
    for (const m of movies) {
      if (Array.isArray(m.genres)) {
        for (const g of m.genres) {
          counts[g] = (counts[g] || 0) + 1;
        }
      }
    }
    return GENRE_NAMES.map((genre) => ({
      genre,
      count: counts[genre] || 0,
    }));
  }, [movies]);

  // ── Context value ────────────────────────────────────────────────────────
  const value = useMemo(() => {
    const movieList = movies;
    const getById = (id) => movieMap.current.get(String(id)) || null;
    const byGenre = (genre) =>
      movieList.filter((m) => Array.isArray(m.genres) && m.genres.includes(genre));

    return {
      movies: movieList,
      loading,
      backendReady,
      totalCount,
      error,
      reload: loadInitialPages,
      getById,
      fetchMovieById,
      byGenre,
      genreCounts,
      searchCatalog,
    };
  }, [movies, loading, backendReady, totalCount, error, loadInitialPages, fetchMovieById, searchCatalog, genreCounts]);

  return <MovieContext.Provider value={value}>{children}</MovieContext.Provider>;
}

export function useMovies() {
  const context = useContext(MovieContext);
  if (!context) throw new Error("useMovies must be used inside <MovieProvider>");
  return context;
}
