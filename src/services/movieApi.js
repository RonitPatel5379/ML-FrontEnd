/**
 * Centralized movie service.
 *
 * Data flows:
 *  - TMDB remote API (if VITE_TMDB_API_KEY is set)
 *  - ML backend via mlApi.js (primary local-mode source)
 *  - Local MOVIES array (instant fallback / curated data)
 */

import { MOVIES } from "../data/movies";
import { GENRE_NAMES, genreFromSlug } from "../data/genres";
import { matchesQuery } from "../utils/helpers";
import { similarMovies } from "../utils/recommendationEngine";
import { getRankedTrendingMovies } from "../utils/trending";
import {
  normalizeMlMovie,
  fetchMlMovieById,
  searchMlMovies,
} from "./mlApi";

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
export const usingRemoteApi = Boolean(TMDB_KEY);

const immediate = (data) => Promise.resolve(data);

async function tmdb(path, params = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_KEY);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") url.searchParams.set(key, value);
  });
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`TMDB request failed (${response.status})`);
  return response.json();
}

/** Maps a TMDB movie payload onto the local movie shape. */
function mapTmdbMovie(raw) {
  return {
    id: raw.id,
    title: raw.title || raw.name,
    year: Number((raw.release_date || "").slice(0, 4)) || 0,
    rating: Number((raw.vote_average || 0).toFixed(1)),
    runtime: raw.runtime || 0,
    genres: (raw.genres || []).map((g) => (g.name === "Science Fiction" ? "Sci-Fi" : g.name)),
    overview: raw.overview || "",
    director: raw.director || "Unknown",
    cast: raw.cast || [],
    language: raw.original_language === "en" ? "English" : raw.original_language,
    certification: "PG-13",
    popularity: Math.round(raw.popularity || 0),
    writers: [],
    companies: (raw.production_companies || []).map((c) => c.name),
    budget: raw.budget || 0,
    revenue: raw.revenue || 0,
    hue: (raw.id * 37) % 360,
    backdrop: "space",
    remotePoster: raw.poster_path
      ? `https://image.tmdb.org/t/p/w500${raw.poster_path}`
      : null,
    remoteBackdrop: raw.backdrop_path
      ? `https://image.tmdb.org/t/p/original${raw.backdrop_path}`
      : null,
  };
}

// ─── Local / context cache accessor ─────────────────────────────────────────

// The MovieContext populates the movieMap; movieApi functions use the local
// MOVIES array only as a fallback when the context isn't available.
const localFallback = () => MOVIES.slice();

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getAllMovies() {
  if (usingRemoteApi) {
    const data = await tmdb("/movie/popular");
    return data.results.map(mapTmdbMovie);
  }
  return immediate(localFallback());
}

export async function getTrendingMovies(window = "week") {
  if (usingRemoteApi) {
    const data = await tmdb(
      `/trending/movie/${window === "day" || window === "today" ? "day" : "week"}`,
    );
    return data.results.map(mapTmdbMovie);
  }
  return immediate(getRankedTrendingMovies(localFallback(), window).slice(0, 24));
}

export async function getPopularMovies() {
  return immediate(localFallback().sort((a, b) => b.popularity - a.popularity).slice(0, 24));
}

export async function getTopRatedMovies() {
  return immediate(localFallback().sort((a, b) => b.rating - a.rating).slice(0, 24));
}

export async function getNewReleases() {
  return immediate(localFallback().sort((a, b) => b.year - a.year).slice(0, 24));
}

/**
 * Fetches full movie details by ID.
 * Priority:
 *  1. Curated local movie with real overview (instant)
 *  2. ML backend /movies/{id} (full data)
 *  3. Local MOVIES fallback
 */
export async function getMovieDetails(id) {
  if (usingRemoteApi) {
    const data = await tmdb(`/movie/${id}`);
    return mapTmdbMovie(data);
  }

  // 1. Rich local match (curated)
  const localMatch = MOVIES.find((item) => String(item.id) === String(id));
  if (
    localMatch &&
    localMatch.overview &&
    !localMatch.overview.startsWith("Explore full details")
  ) {
    return immediate(localMatch);
  }

  // 2. Backend full detail
  try {
    const mlMovie = await fetchMlMovieById(id);
    if (mlMovie) return mlMovie;
  } catch {
    // continue
  }

  if (localMatch) return immediate(localMatch);
  throw new Error("We couldn't find that movie.");
}

export async function getSimilarMovies(id) {
  const movie = localFallback().find((item) => String(item.id) === String(id));
  return immediate(similarMovies(movie, localFallback(), 12));
}

/**
 * Searches the catalog.
 * Priority: local curated matches → ML backend deep search.
 */
export async function searchMovies(query) {
  if (!query || !query.trim()) return [];
  if (usingRemoteApi) {
    const data = await tmdb("/search/movie", { query });
    return data.results.map(mapTmdbMovie);
  }

  const pool = localFallback();
  const localMatches = pool.filter((movie) => matchesQuery(movie, query)).slice(0, 30);

  try {
    const backendResults = await searchMlMovies(query, 20);
    if (backendResults?.length) {
      const mergedMap = new Map(localMatches.map((m) => [String(m.id), m]));
      backendResults.forEach((m) => {
        if (!mergedMap.has(String(m.id))) mergedMap.set(String(m.id), m);
      });
      return Array.from(mergedMap.values());
    }
  } catch {
    // return local matches
  }

  return localMatches;
}

export async function getMoviesByGenre(genre) {
  const name = GENRE_NAMES.includes(genre) ? genre : genreFromSlug(genre);
  return immediate(localFallback().filter((movie) => movie.genres.includes(name)));
}

export async function getMoviesInGenreSync(genre) {
  return localFallback().filter((movie) => movie.genres.includes(genre));
}

// Re-export normalizeMlMovie so any legacy consumers still work
export { normalizeMlMovie };
