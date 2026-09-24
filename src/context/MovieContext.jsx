import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getAllMovies } from "../services/movieApi";
import { GENRE_NAMES } from "../data/genres";

const MovieContext = createContext(null);

export function MovieProvider({ children }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const value = useMemo(() => {
    const getById = (id) => movies.find((movie) => String(movie.id) === String(id)) || null;
    const byGenre = (genre) => movies.filter((movie) => movie.genres.includes(genre));
    const genreCounts = GENRE_NAMES.map((genre) => ({
      genre,
      count: movies.filter((movie) => movie.genres.includes(genre)).length,
    }));

    return { movies, loading, error, reload: load, getById, byGenre, genreCounts };
  }, [movies, loading, error, load]);

  return <MovieContext.Provider value={value}>{children}</MovieContext.Provider>;
}

export function useMovies() {
  const context = useContext(MovieContext);
  if (!context) throw new Error("useMovies must be used inside <MovieProvider>");
  return context;
}
