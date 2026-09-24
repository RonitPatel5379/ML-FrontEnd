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

const all = () => MOVIES.slice();

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
  const list = getRankedTrendingMovies(all(), window).slice(0, 20);
  return immediate(list);
}

export async function getPopularMovies() {
  return immediate(all().sort((a, b) => b.popularity - a.popularity).slice(0, 20));
}

export async function getTopRatedMovies() {
  return immediate(all().sort((a, b) => b.rating - a.rating).slice(0, 20));
}

export async function getNewReleases() {
  return immediate(all().sort((a, b) => b.year - a.year).slice(0, 20));
}

export async function getMovieDetails(id) {
  if (usingRemoteApi) {
    const data = await tmdb(`/movie/${id}`);
    return mapTmdbMovie(data);
  }
  const movie = all().find((item) => String(item.id) === String(id));
  if (!movie) throw new Error("We couldn't find that movie.");
  return immediate(movie);
}

export async function getSimilarMovies(id) {
  const movie = all().find((item) => String(item.id) === String(id));
  return immediate(similarMovies(movie, all(), 12));
}

export async function searchMovies(query) {
  if (usingRemoteApi && query) {
    const data = await tmdb("/search/movie", { query });
    return data.results.map(mapTmdbMovie);
  }
  return immediate(
    all().filter((movie) => matchesQuery(movie, query)),
  );
}

export async function getMoviesByGenre(genre) {
  const name = GENRE_NAMES.includes(genre) ? genre : genreFromSlug(genre);
  return immediate(all().filter((movie) => movie.genres.includes(name)));
}

export async function getMoviesInGenreSync(genre) {
  return all().filter((movie) => movie.genres.includes(genre));
}
