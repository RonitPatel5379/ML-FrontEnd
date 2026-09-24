import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getAllMovies, loadFullDataset, getMovieDetails, searchMovies } from "../services/movieApi";
import { GENRE_NAMES } from "../data/genres";

const MovieContext = createContext(null);

export function MovieProvider({ children }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullLoading, setFullLoading] = useState(false);
  const [datasetReady, setDatasetReady] = useState(false);
  const [error, setError] = useState(null);

  // 1. Initial fast load of curated movies
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllMovies();
      if (!data?.length) throw new Error("No movies were returned.");
      setMovies(data);
    } catch (err) {
      setError(err.message || "Unable to load movies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 2. Background load of full 69,405 movies from final_movie_daaset.csv
  useEffect(() => {
    let cancelled = false;
    setFullLoading(true);
    loadFullDataset()
      .then((fullList) => {
        if (!cancelled && Array.isArray(fullList) && fullList.length > 0) {
          setMovies(fullList);
          setDatasetReady(true);
        }
      })
      .catch((err) => {
        console.warn("[MovieContext] Full dataset background load notice:", err?.message || err);
      })
      .finally(() => {
        if (!cancelled) setFullLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // On-demand fetch of any movie by ID with state caching
  const fetchMovieById = useCallback(async (id) => {
    if (!id) return null;
    const existing = movies.find((m) => String(m.id) === String(id));
    if (existing && existing.overview && !existing.overview.startsWith("Explore full details")) {
      return existing;
    }
    try {
      const details = await getMovieDetails(id);
      if (details) {
        setMovies((prev) => {
          const index = prev.findIndex((m) => String(m.id) === String(id));
          if (index >= 0) {
            const next = [...prev];
            next[index] = { ...next[index], ...details };
            return next;
          }
          return [details, ...prev];
        });
        return details;
      }
    } catch {
      // Fallback to existing if available
    }
    return existing || null;
  }, [movies]);

  const value = useMemo(() => {
    const getById = (id) => movies.find((movie) => String(movie.id) === String(id)) || null;
    const byGenre = (genre) => movies.filter((movie) => Array.isArray(movie.genres) && movie.genres.includes(genre));
    const genreCounts = GENRE_NAMES.map((genre) => ({
      genre,
      count: movies.filter((movie) => Array.isArray(movie.genres) && movie.genres.includes(genre)).length,
    }));

    return {
      movies,
      loading,
      fullLoading,
      datasetReady,
      totalCount: movies.length,
      error,
      reload: load,
      getById,
      fetchMovieById,
      byGenre,
      genreCounts,
      searchCatalog: searchMovies,
    };
  }, [movies, loading, fullLoading, datasetReady, error, load, fetchMovieById]);

  return <MovieContext.Provider value={value}>{children}</MovieContext.Provider>;
}

export function useMovies() {
  const context = useContext(MovieContext);
  if (!context) throw new Error("useMovies must be used inside <MovieProvider>");
  return context;
}
