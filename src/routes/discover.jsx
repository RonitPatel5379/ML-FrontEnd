import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Info, Loader2, Search, X } from "lucide-react";

import PageHeader from "../components/PageHeader";
import FilterBar, { DEFAULT_FILTERS, applyFilters } from "../components/FilterBar";
import MovieGrid from "../components/MovieGrid";
import ErrorState from "../components/ErrorState";
import { useMovies } from "../context/MovieContext";
import { fetchMlCatalog } from "../services/mlApi";

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

const SORT_MAP = {
  default: "popularity",
  rating: "rating",
  newest: "newest",
  oldest: "oldest",
  az: "az",
};

function Discover() {
  const { movies: contextMovies, loading: ctxLoading, error, reload, totalCount } = useMovies();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // ── Backend catalog paging state ─────────────────────────────────────────
  const [backendMovies, setBackendMovies] = useState([]);
  const [backendPage, setBackendPage] = useState(0); // 0 = not yet fetched
  const [backendTotal, setBackendTotal] = useState(0);
  const [backendTotalPages, setBackendTotalPages] = useState(1);
  const [backendLoading, setBackendLoading] = useState(false);
  const loadMoreRef = useRef(null);

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

  // ── Backend sort parameter ───────────────────────────────────────────────
  const backendSort = useMemo(() => SORT_MAP[filters.sortBy] || "popularity", [filters.sortBy]);

  // ── Fetch a specific backend page ────────────────────────────────────────
  const fetchBackendPage = useCallback(
    async (page) => {
      if (backendLoading) return;
      setBackendLoading(true);
      try {
        const data = await fetchMlCatalog({
          page,
          limit: 48,
          genre: filters.genre || "",
          sortBy: backendSort,
          search: query.trim(),
          minRating: Number(filters.minRating) || 0,
          language: filters.language || "",
        });
        if (!data) return;
        setBackendTotal(data.total);
        setBackendTotalPages(data.totalPages);
        setBackendMovies((prev) =>
          page === 1 ? data.results : [...prev, ...data.results],
        );
        setBackendPage(page);
      } finally {
        setBackendLoading(false);
      }
    },
    [backendLoading, filters.genre, filters.language, filters.minRating, backendSort, query],
  );

  // ── Reset & initial fetch whenever filters / query change ────────────────
  const filtersKey = JSON.stringify({ query, filters });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setBackendMovies([]);
    setBackendPage(0);
    fetchBackendPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  // ── Intersection Observer for infinite scroll ────────────────────────────
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          !backendLoading &&
          backendPage > 0 &&
          backendPage < backendTotalPages
        ) {
          fetchBackendPage(backendPage + 1);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [backendLoading, backendPage, backendTotalPages, fetchBackendPage]);

  // ── Local filter (for quick client-side highlighting) ───────────────────
  // We show backend results primarily. For instant local results while the
  // backend loads, we also apply filters to the context catalog.
  const localResults = useMemo(
    () => applyFilters(contextMovies, filters, query),
    [contextMovies, filters, query],
  );

  // Decide what to show: backend paged results (primary) or local (fallback)
  const hasBackend = backendMovies.length > 0;
  const displayMovies = hasBackend ? backendMovies : localResults;
  const displayTotal = hasBackend ? backendTotal : localResults.length;
  const loading = ctxLoading && !hasBackend;

  const hasActiveFilters = useMemo(
    () =>
      Boolean(filters.genre) ||
      Boolean(filters.language) ||
      Boolean(filters.decade) ||
      Number(filters.minRating) > 0 ||
      Number(filters.maxRuntime) < 240,
    [filters],
  );

  const hiddenMatchesCount = useMemo(() => {
    if (!query.trim() || !hasActiveFilters || displayMovies.length > 0) return 0;
    return applyFilters(contextMovies, DEFAULT_FILTERS, query).length;
  }, [contextMovies, query, hasActiveFilters, displayMovies.length]);

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setQuery("");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Discover"
        title="Find exactly what you're in the mood for"
        description={`Search ${totalCount.toLocaleString()} movies. Filter by genre, year, rating and language.`}
      >
        <div className="glass flex items-center gap-3 rounded-full px-5 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            id="discover-search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search movies, actors, directors, genres, years..."
            aria-label="Search movies"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              id="discover-clear-search"
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
              resultCount={displayTotal}
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
                  id="discover-reset-filters"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="btn-primary shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold"
                >
                  Reset filters to view
                </button>
              </div>
            )}

            <MovieGrid
              movies={displayMovies}
              loading={loading}
              onEmptyAction={handleReset}
              emptyActionLabel={query || hasActiveFilters ? "Reset search & filters" : "Browse trending"}
              emptyActionTo="/trending"
            />

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef} className="flex justify-center py-6" aria-live="polite">
              {backendLoading && (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Loading more movies…
                </span>
              )}
              {!backendLoading && backendPage > 0 && backendPage >= backendTotalPages && displayMovies.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing all {displayTotal.toLocaleString()} movies
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
