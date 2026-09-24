import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Info, Search, X } from "lucide-react";

import PageHeader from "../components/PageHeader";
import FilterBar, { DEFAULT_FILTERS, applyFilters } from "../components/FilterBar";
import MovieGrid from "../components/MovieGrid";
import ErrorState from "../components/ErrorState";
import { useMovies } from "../context/MovieContext";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Movies — CineVerse" },
      {
        name: "description",
        content:
          "Search by title, actor, director or genre and filter by year, rating, language and runtime.",
      },
      { property: "og:title", content: "Discover Movies — CineVerse" },
      {
        property: "og:description",
        content: "A powerful movie discovery interface with rich filters and sorting.",
      },
    ],
  }),
  component: Discover,
});

function Discover() {
  const { movies, loading, error, reload } = useMovies();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Sync URL search params on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlQuery = params.get("q") || params.get("search");
      const urlGenre = params.get("genre");
      if (urlQuery) setQuery(urlQuery);
      if (urlGenre) setFilters((prev) => ({ ...prev, genre: urlGenre }));
    }
  }, []);

  const results = useMemo(() => applyFilters(movies, filters, query), [movies, filters, query]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(filters.genre) ||
      Boolean(filters.language) ||
      Boolean(filters.decade) ||
      Number(filters.minRating) > 0 ||
      Number(filters.maxRuntime) < 240,
    [filters],
  );

  // Check if matches exist that are only hidden because of active filters
  const hiddenMatchesCount = useMemo(() => {
    if (!query.trim() || !hasActiveFilters || results.length > 0) return 0;
    return applyFilters(movies, DEFAULT_FILTERS, query).length;
  }, [movies, query, hasActiveFilters, results.length]);

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setQuery("");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Discover"
        title="Find exactly what you're in the mood for"
        description="Search across titles, directors, cast and genres, then narrow it down with filters."
      >
        <div className="glass flex items-center gap-3 rounded-full px-5 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search movies, actors, directors, genres, years..."
            aria-label="Search movies"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search query"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </PageHeader>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-8">
        {error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : (
          <>
            <FilterBar
              filters={filters}
              onChange={setFilters}
              onReset={handleReset}
              resultCount={results.length}
            />

            {hiddenMatchesCount > 0 && (
              <div className="glass card-elevated flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2.5 text-sm text-foreground">
                  <Info className="h-4 w-4 shrink-0 text-primary-glow" aria-hidden="true" />
                  <span>
                    Found <span className="font-semibold text-primary-glow">{hiddenMatchesCount}</span> movie
                    {hiddenMatchesCount > 1 ? "s" : ""} matching &ldquo;{query}&rdquo; outside your active filters.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="btn-primary shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold"
                >
                  Reset filters to view
                </button>
              </div>
            )}

            <MovieGrid
              movies={results}
              loading={loading}
              onEmptyAction={handleReset}
              emptyActionLabel={query || hasActiveFilters ? "Reset search & filters" : "Browse trending"}
              emptyActionTo="/trending"
            />
          </>
        )}
      </div>
    </div>
  );
}
