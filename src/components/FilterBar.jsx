import { SlidersHorizontal } from "lucide-react";

import { GENRE_NAMES, LANGUAGES } from "../data/genres";
import { matchesQuery, normalizeText } from "../utils/helpers";

const SORTS = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "az", label: "A–Z" },
];

const selectClass =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary";

export default function FilterBar({
  filters,
  onChange,
  onReset,
  resultCount,
  allowedGenres,
}) {
  const set = (key) => (event) => onChange({ ...filters, [key]: event.target.value });
  const genreList = Array.isArray(allowedGenres) && allowedGenres.length > 0 ? allowedGenres : GENRE_NAMES;

  return (
    <div className="glass card-elevated rounded-3xl p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-primary-glow" aria-hidden="true" />
          Refine
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {typeof resultCount === "number" ? resultCount.toLocaleString() : resultCount} titles
          </span>
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-primary-glow hover:underline"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted-foreground">Genre</span>
          <select className={selectClass} value={filters.genre} onChange={set("genre")}>
            <option value="">All genres</option>
            {genreList.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-muted-foreground">Language</span>
          <select className={selectClass} value={filters.language} onChange={set("language")}>
            <option value="">Any language</option>
            {LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-muted-foreground">Release period</span>
          <select className={selectClass} value={filters.decade} onChange={set("decade")}>
            <option value="">Any year</option>
            <option value="2020">2020 and newer</option>
            <option value="2010">2010 – 2019</option>
            <option value="2000">2000 – 2009</option>
            <option value="1990">1990 – 1999</option>
            <option value="classic">Before 1990 (Classics)</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-muted-foreground">
            Minimum rating · {Number(filters.minRating).toFixed(1)}+
          </span>
          <input
            type="range"
            min="0"
            max="9.0"
            step="0.5"
            value={filters.minRating}
            onChange={set("minRating")}
            className="w-full accent-[var(--primary)]"
            aria-label="Minimum rating"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-muted-foreground">
            Max runtime · {Number(filters.maxRuntime) >= 240 ? "Any runtime" : `${filters.maxRuntime} min`}
          </span>
          <input
            type="range"
            min="60"
            max="240"
            step="15"
            value={filters.maxRuntime}
            onChange={set("maxRuntime")}
            className="w-full accent-[var(--primary)]"
            aria-label="Maximum runtime"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-muted-foreground">Sort by</span>
          <select className={selectClass} value={filters.sort} onChange={set("sort")}>
            {SORTS.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export const DEFAULT_FILTERS = {
  genre: "",
  language: "",
  decade: "",
  minRating: 0,
  maxRuntime: 240,
  sort: "popular",
};

/** Pure filter + sort pipeline so the page component stays presentational. */
export function applyFilters(movies, filters, query = "", allowedGenres = null) {
  if (!Array.isArray(movies)) return [];
  const q = (query || "").trim();
  const allowedSet =
    Array.isArray(allowedGenres) && allowedGenres.length > 0
      ? new Set(allowedGenres.map((g) => g.toLowerCase()))
      : null;

  const filtered = movies.filter((movie) => {
    // 0. Enforce allowed genres (e.g. Discover section limited to Action, Romance, Drama, Doc, Comedy)
    if (allowedSet) {
      if (
        !Array.isArray(movie.genres) ||
        !movie.genres.some((g) => allowedSet.has(String(g).trim().toLowerCase()))
      ) {
        return false;
      }
    }

    // 1. Search Query Match
    if (q && !matchesQuery(movie, q)) return false;

    // 2. Genre Filter
    if (
      filters.genre &&
      !(
        Array.isArray(movie.genres) &&
        movie.genres.some((g) => g.toLowerCase() === filters.genre.toLowerCase())
      )
    ) {
      return false;
    }

    // 3. Language Filter
    if (filters.language && movie.language !== filters.language) {
      return false;
    }

    // 4. Release Period / Decade Filter
    if (filters.decade) {
      if (filters.decade === "classic") {
        if (Number(movie.year) >= 1990) return false;
      } else {
        const from = Number(filters.decade);
        const to = from === 2020 ? 9999 : from + 9;
        if (Number(movie.year) < from || Number(movie.year) > to) return false;
      }
    }

    // 5. Minimum Rating Filter
    if (movie.rating < Number(filters.minRating || 0)) return false;

    // 6. Max Runtime Filter (only filters when set below 240 min)
    if (Number(filters.maxRuntime) < 240 && movie.runtime > Number(filters.maxRuntime)) {
      return false;
    }

    return true;
  });

  const sorters = {
    popular: (a, b) => b.popularity - a.popularity,
    rating: (a, b) => b.rating - a.rating,
    newest: (a, b) => b.year - a.year,
    oldest: (a, b) => a.year - b.year,
    az: (a, b) => a.title.localeCompare(b.title),
  };

  // When searching with a query, prioritize title relevance!
  if (q) {
    const normQ = normalizeText(q);
    const compactQ = normQ.replace(/\s+/g, "");

    return filtered.sort((a, b) => {
      const aTitle = normalizeText(a.title);
      const bTitle = normalizeText(b.title);
      const aCompact = aTitle.replace(/\s+/g, "");
      const bCompact = bTitle.replace(/\s+/g, "");

      const aExact = aTitle === normQ || aCompact === compactQ ? 1 : 0;
      const bExact = bTitle === normQ || bCompact === compactQ ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      const aStarts = aTitle.startsWith(normQ) ? 1 : 0;
      const bStarts = bTitle.startsWith(normQ) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;

      const aContains = aTitle.includes(normQ) || aCompact.includes(compactQ) ? 1 : 0;
      const bContains = bTitle.includes(normQ) || bCompact.includes(compactQ) ? 1 : 0;
      if (aContains !== bContains) return bContains - aContains;

      return (sorters[filters.sort] || sorters.popular)(a, b);
    });
  }

  return filtered.sort(sorters[filters.sort] || sorters.popular);
}
