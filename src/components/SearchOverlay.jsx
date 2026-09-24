import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";

import Poster from "./Poster";
import Rating from "./Rating";
import { useMovies } from "../context/MovieContext";
import { useUser } from "../context/UserContext";
import { matchesQuery } from "../utils/helpers";

const SUGGESTIONS = ["Sci-Fi", "Denis Villeneuve", "Animation", "Thriller", "Interstellar"];

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef(null);
  const { movies, searchCatalog } = useMovies();
  const { recordSearch, searches } = useUser();
  const [liveResults, setLiveResults] = useState([]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setDebounced("");
      setLiveResults([]);
      const id = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [open]);

  // Debounced search input keeps result filtering cheap while typing.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(query);
      if (query.trim().length > 1) recordSearch(query);
    }, 240);
    return () => clearTimeout(id);
  }, [query, recordSearch]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    let active = true;
    const q = debounced.trim();
    if (!q) {
      setLiveResults([]);
      return;
    }

    // 1. Instant local match across loaded catalog
    const local = movies.filter((movie) => matchesQuery(movie, q)).slice(0, 10);
    setLiveResults(local);

    // 2. Deep search against complete 69,405 backend dataset
    if (searchCatalog) {
      searchCatalog(q).then((deep) => {
        if (!active || !deep?.length) return;
        const map = new Map();
        local.forEach((m) => map.set(String(m.id), m));
        deep.forEach((m) => map.set(String(m.id), m));
        setLiveResults(Array.from(map.values()).slice(0, 12));
      });
    }

    return () => {
      active = false;
    };
  }, [debounced, movies, searchCatalog]);

  const results = liveResults;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Search CineVerse"
        >
          <div className="mx-auto max-w-3xl px-4 pt-24 sm:px-6">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="glass card-elevated overflow-hidden rounded-3xl"
            >
              <div className="flex items-center gap-3 px-5 py-4">
                <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search movies, actors, genres..."
                  aria-label="Search movies, actors, genres"
                  className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="btn-glass grid h-9 w-9 place-items-center rounded-full"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="max-h-[55vh] overflow-y-auto border-t border-border">
                {!debounced.trim() && (
                  <div className="px-5 py-6">
                    <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
                      {searches.length ? "Recent searches" : "Try searching"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(searches.length ? searches : SUGGESTIONS).map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => setQuery(term)}
                          className="btn-glass rounded-full px-3 py-1.5 text-xs"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {debounced.trim() && results.length === 0 && (
                  <div className="px-5 py-10 text-center">
                    <p className="font-display text-lg font-semibold">
                      We couldn&apos;t find that movie.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Try one of these instead:
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {SUGGESTIONS.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => setQuery(term)}
                          className="btn-glass rounded-full px-3 py-1.5 text-xs"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <ul>
                  {results.map((movie) => (
                    <li key={movie.id}>
                      <Link
                        to="/movie/$id"
                        params={{ id: String(movie.id) }}
                        onClick={onClose}
                        className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-2"
                      >
                        <div className="h-16 w-11 shrink-0 overflow-hidden rounded-lg">
                          <Poster movie={movie} className="h-full w-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{movie.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {movie.year} · {movie.genres.join(", ")}
                          </p>
                        </div>
                        <Rating value={movie.rating} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
