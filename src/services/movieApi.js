/**
 * Centralized movie service.
 *
 * Today it resolves from the bundled dataset (src/data/movies.js). Set
 * VITE_TMDB_API_KEY and the TMDB branch takes over without any UI changes.
 */

import { MOVIES } from "../data/movies";
import { GENRE_NAMES, genreFromSlug } from "../data/genres";
import { matchesQuery } from "../utils/helpers";
import { similarMovies } from "../utils/recommendationEngine";
import { getRankedTrendingMovies } from "../utils/trending";

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

import { fetchMlMovieById, searchMlMovies } from "./mlApi";

let fullMoviesCache = null;
let fullMoviesPromise = null;

/**
 * Loads the complete 69,405 movie catalog in the background.
 * Cached in memory so subsequent accesses are instantaneous.
 */
export async function loadFullDataset() {
  if (fullMoviesCache) return fullMoviesCache;
  if (fullMoviesPromise) return fullMoviesPromise;

  fullMoviesPromise = (async () => {
    try {
      const res = await fetch("/data/all_movies.json");
      if (!res.ok) throw new Error("Dataset fetch failed");
      const rows = await res.json();

      const mapped = rows.map(([id, title, year, rating, genresStr, poster, runtime, lang, pop]) => {
        const genres = genresStr
          ? genresStr.split(",").map((s) => (s.trim() === "Science Fiction" ? "Sci-Fi" : s.trim())).filter(Boolean)
          : [];
        const posterUrl = poster
          ? (poster.startsWith("http") ? poster : `https://image.tmdb.org/t/p/w500/${poster}`)
          : null;
        return {
          id,
          title: title || "Untitled",
          year: year || 0,
          rating: Number((rating || 0).toFixed(1)),
          runtime: runtime || 105,
          genres,
          overview: "Explore full details and recommendations for this title.",
          director: "Acclaimed Filmmaker",
          cast: [],
          language: lang === "en" ? "English" : (lang || "English"),
          certification: "PG-13",
          popularity: Math.round(pop || 0),
          budget: 0,
          revenue: 0,
          hue: (id * 37) % 360,
          backdrop: "neon",
          remotePoster: posterUrl,
        };
      });

      // Retain full curated descriptions and details for curated titles
      const map = new Map();
      mapped.forEach((m) => map.set(String(m.id), m));
      MOVIES.forEach((m) => map.set(String(m.id), m));

      fullMoviesCache = Array.from(map.values());
      return fullMoviesCache;
    } catch (err) {
      console.warn("[MovieApi] Using base curated movies dataset:", err);
      return MOVIES;
    }
  })();

  return fullMoviesPromise;
}

const all = () => (fullMoviesCache ? fullMoviesCache.slice() : MOVIES.slice());

export async function getAllMovies() {
  if (usingRemoteApi) {
    const data = await tmdb("/movie/popular");
    return data.results.map(mapTmdbMovie);
  }
  return immediate(all());
}

export async function getTrendingMovies(window = "week") {
  if (usingRemoteApi) {
    const data = await tmdb(`/trending/movie/${window === "day" || window === "today" ? "day" : "week"}`);
    return data.results.map(mapTmdbMovie);
  }
  const list = getRankedTrendingMovies(all(), window).slice(0, 24);
  return immediate(list);
}

export async function getPopularMovies() {
  return immediate(all().sort((a, b) => b.popularity - a.popularity).slice(0, 24));
}

export async function getTopRatedMovies() {
  return immediate(all().sort((a, b) => b.rating - a.rating).slice(0, 24));
}

export async function getNewReleases() {
  return immediate(all().sort((a, b) => b.year - a.year).slice(0, 24));
}

export async function getMovieDetails(id) {
  if (usingRemoteApi) {
    const data = await tmdb(`/movie/${id}`);
    return mapTmdbMovie(data);
  }

  // 1. Check if movie with full details is already in memory
  const localMatch = MOVIES.find((item) => String(item.id) === String(id));
  if (localMatch && localMatch.overview && !localMatch.overview.startsWith("Explore full details")) {
    return immediate(localMatch);
  }

  // 2. Fetch rich synopsis & cluster from ML backend
  try {
    const mlMovie = await fetchMlMovieById(id);
    if (mlMovie) {
      return mlMovie;
    }
  } catch {
    // Continue to dataset fallback
  }

  if (localMatch) return immediate(localMatch);

  // 3. Search in full 69,405 dataset
  if (fullMoviesCache) {
    const match = fullMoviesCache.find((item) => String(item.id) === String(id));
    if (match) return immediate(match);
  }

  const full = await loadFullDataset();
  const found = full.find((item) => String(item.id) === String(id));
  if (found) return immediate(found);

  throw new Error("We couldn't find that movie.");
}

export async function getSimilarMovies(id) {
  const movie = all().find((item) => String(item.id) === String(id));
  return immediate(similarMovies(movie, all(), 12));
}

export async function searchMovies(query) {
  if (!query || !query.trim()) return [];
  if (usingRemoteApi) {
    const data = await tmdb("/search/movie", { query });
    return data.results.map(mapTmdbMovie);
  }

  const pool = fullMoviesCache || MOVIES;
  const localMatches = pool.filter((movie) => matchesQuery(movie, query)).slice(0, 30);

  // Also query the ML backend for deep catalog results
  try {
    const backendResults = await searchMlMovies(query, 20);
    if (backendResults?.length) {
      const mergedMap = new Map();
      localMatches.forEach((m) => mergedMap.set(String(m.id), m));
      backendResults.forEach((bm) => {
        const key = String(bm.id);
        if (!mergedMap.has(key)) {
          const genres = Array.isArray(bm.genres)
            ? bm.genres
            : typeof bm.genres === "string"
              ? bm.genres.split(",").map((s) => s.trim())
              : [];
          mergedMap.set(key, {
            id: bm.id,
            title: bm.title,
            year: bm.release_year || bm.year || 0,
            rating: Number((bm.vote_average || 7.0).toFixed(1)),
            runtime: bm.runtime || 110,
            genres,
            overview: bm.overview || "Explore full details for this title.",
            remotePoster: bm.poster_path || null,
            popularity: Math.round(bm.popularity || 0),
          });
        }
      });
      return Array.from(mergedMap.values());
    }
  } catch {
    // Return local matches if backend request fails
  }

  return localMatches;
}

export async function getMoviesByGenre(genre) {
  const name = GENRE_NAMES.includes(genre) ? genre : genreFromSlug(genre);
  return immediate(all().filter((movie) => movie.genres.includes(name)));
}

export async function getMoviesInGenreSync(genre) {
  return all().filter((movie) => movie.genres.includes(genre));
}

