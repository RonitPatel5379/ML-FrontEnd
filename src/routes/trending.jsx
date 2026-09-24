import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Flame,
  Minus,
  Sparkles,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import Poster from "../components/Poster";
import Rating from "../components/Rating";
import MovieRow from "../components/MovieRow";
import ErrorState from "../components/ErrorState";
import { RowSkeleton } from "../components/LoadingSpinner";
import { useMovies } from "../context/MovieContext";
import { formatRuntime } from "../utils/helpers";
import {
  getRankedTrendingMovies,
  getTrendingPeriodInfo,
} from "../utils/trending";

export const Route = createFileRoute("/trending")({
  head: () => ({
    meta: [
      { title: "Trending Movies — CineVerse" },
      {
        name: "description",
        content: "The most-watched movies today, this week and this month, ranked on CineVerse.",
      },
      { property: "og:title", content: "Trending Movies — CineVerse" },
      {
        property: "og:description",
        content: "Daily, weekly and monthly trending movie charts.",
      },
    ],
  }),
  component: Trending,
});

const WINDOWS = [
  { key: "today", label: "Trending Today", period: "Changes daily" },
  { key: "week", label: "Trending This Week", period: "Changes weekly" },
  { key: "month", label: "Trending This Month", period: "Changes monthly" },
];

function Trending() {
  const { movies, loading, error, reload } = useMovies();
  const [active, setActive] = useState("today");

  const periodInfo = useMemo(() => getTrendingPeriodInfo(active), [active]);

  const ranked = useMemo(
    () => getRankedTrendingMovies(movies, active).slice(0, 10),
    [movies, active],
  );

  const alsoClimbing = useMemo(
    () => getRankedTrendingMovies(movies, active).slice(10, 24),
    [movies, active],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Live Charts"
        title="Trending on CineVerse"
        description={periodInfo.subtitle}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="glass inline-flex rounded-full p-1">
            {WINDOWS.map((window) => (
              <button
                key={window.key}
                type="button"
                onClick={() => setActive(window.key)}
                aria-pressed={active === window.key}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  active === window.key
                    ? "btn-primary shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {window.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 font-medium text-primary-glow">
              <Calendar className="h-3 w-3" />
              {periodInfo.badge}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              {periodInfo.cycleLabel}
            </span>
          </div>
        </div>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        {error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : loading ? (
          <RowSkeleton count={4} />
        ) : (
          <ol className="space-y-4">
            {ranked.map((movie, index) => (
              <li key={movie.id}>
                <Link
                  to="/movie/$id"
                  params={{ id: String(movie.id) }}
                  className="glass card-elevated group flex items-center gap-4 rounded-3xl p-4 transition-transform hover:translate-x-1 sm:gap-6"
                >
                  <span className="w-14 shrink-0 text-center font-display text-4xl font-black text-foreground/25 tabular-nums sm:w-20 sm:text-6xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl sm:h-32 sm:w-22">
                    <Poster movie={movie} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-display text-lg font-bold sm:text-xl">
                        {movie.title}
                      </h2>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <Rating value={movie.rating} />
                      <span>{movie.year}</span>
                      <span>{formatRuntime(movie.runtime)}</span>
                      <span className="truncate">{movie.genres.join(" · ")}</span>
                    </div>
                    <p className="mt-2 hidden line-clamp-2 text-sm text-muted-foreground sm:block">
                      {movie.overview}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {movie.trendMomentum > 0 ? (
                      <span className="hidden items-center gap-0.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 sm:inline-flex">
                        <ArrowUpRight className="h-3.5 w-3.5" />+{movie.trendMomentum}
                      </span>
                    ) : movie.trendMomentum < 0 ? (
                      <span className="hidden items-center gap-0.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400/80 sm:inline-flex">
                        <ArrowDownRight className="h-3.5 w-3.5" />{movie.trendMomentum}
                      </span>
                    ) : (
                      <span className="hidden items-center gap-0.5 rounded-full bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
                        <Minus className="h-3 w-3" /> 0
                      </span>
                    )}
                    <Flame
                      className="h-6 w-6 shrink-0 text-primary-glow"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>

      <MovieRow
        title="Also climbing the charts"
        subtitle={`Popular picks during ${periodInfo.badge}`}
        movies={alsoClimbing}
        loading={loading}
      />
    </div>
  );
}
