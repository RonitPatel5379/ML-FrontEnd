import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import Hero from "../components/Hero";
import MovieRow from "../components/MovieRow";
import ErrorState from "../components/ErrorState";
import { HeroSkeleton } from "../components/LoadingSpinner";
import { useMovies } from "../context/MovieContext";
import { useUser } from "../context/UserContext";
import { recommendMovies } from "../utils/recommendationEngine";
import { getRankedTrendingMovies } from "../utils/trending";
import { seeded } from "../utils/helpers";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CineVerse — Discover your next favorite movie" },
      {
        name: "description",
        content:
          "Cinematic movie discovery with personalized recommendations, trending charts, watchlists and favorites.",
      },
      { property: "og:title", content: "CineVerse — Discover your next favorite movie" },
      {
        property: "og:description",
        content: "Personalized movie recommendations, trending charts and curated collections.",
      },
    ],
  }),
  component: Home,
});

const CATEGORY_ROWS = [
  { title: "Action & Adventure", genres: ["Action", "Adventure"] },
  { title: "Comedy", genres: ["Comedy"] },
  { title: "Romance", genres: ["Romance"] },
];

function Home() {
  const { movies, loading, error, reload } = useMovies();
  const { favorites, watchlist, recent, watched, preferences } = useUser();

  const featured = useMemo(() => {
    if (!movies.length) return [];

    const today = new Date();
    // Unique deterministic seed for the current calendar day
    const daySeed =
      today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // Pool of high-rated movies suitable for the hero banner
    const highRated = movies.filter((movie) => movie.rating >= 7.8);
    const pool = highRated.length >= 5 ? highRated : movies;

    // Score and shuffle deterministically for each day
    const scored = pool.map((movie, index) => ({
      movie,
      score: seeded(daySeed + movie.id * 31 + index),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map((item) => item.movie);
  }, [movies]);

  const recommendations = useMemo(
    () =>
      recommendMovies({
        movies,
        favorites,
        watchlist,
        recent,
        watched,
        preferences,
        limit: 14,
      }),
    [movies, favorites, watchlist, recent, watched, preferences],
  );

  const continueWatching = useMemo(
    () =>
      (recent || [])
        .filter((entry) => (entry.progress ?? 0) < 100 && !(watched || []).includes(entry.id))
        .map((entry) => {
          const movie = movies.find((item) => item.id === entry.id);
          return movie ? { ...movie, progress: entry.progress } : null;
        })
        .filter(Boolean),
    [recent, watched, movies],
  );

  const trendingToday = useMemo(
    () => getRankedTrendingMovies(movies, "today").slice(0, 14),
    [movies],
  );

  const trendingThisWeek = useMemo(
    () => getRankedTrendingMovies(movies, "week").slice(0, 14),
    [movies],
  );

  const recommendationSubtitle = recommendations[0]?.reason || "Tuned to your taste profile";

  if (error) {
    return (
      <div className="px-4 pt-32 pb-16">
        <ErrorState description={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div>
      {loading ? <HeroSkeleton /> : <Hero movies={featured} />}

      <div className="relative z-10 -mt-10 space-y-2 pb-10">
        <MovieRow
          title="Trending Today"
          subtitle="Updated today · What viewers are watching right now"
          movies={trendingToday}
          loading={loading}
          seeAllTo="/trending"
        />

        {continueWatching.length > 0 && (
          <MovieRow
            title="Continue Watching"
            subtitle="Pick up where you left off"
            movies={continueWatching}
            showProgress
          />
        )}

        <section className="py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="glass card-elevated flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] text-primary-glow uppercase">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Recommended For You
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                  {recommendationSubtitle}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Our engine blends genre affinity, ratings, popularity and your recent activity
                  into a single score.
                </p>
              </div>
              <Link
                to="/preferences"
                className="btn-primary shrink-0 rounded-full px-6 py-3 text-center text-sm font-semibold"
              >
                Tune recommendations
              </Link>
            </div>
          </div>
        </section>

        <MovieRow
          title="Because your taste says so"
          movies={recommendations}
          loading={loading}
          showReason
          seeAllTo="/discover"
        />

        <MovieRow
          title="Popular Movies"
          movies={[...movies].sort((a, b) => b.popularity - a.popularity).slice(4, 18)}
          loading={loading}
        />
        <MovieRow
          title="Top Rated"
          movies={[...movies].sort((a, b) => b.rating - a.rating).slice(0, 14)}
          loading={loading}
        />
        <MovieRow
          title="New Releases"
          movies={[...movies].sort((a, b) => b.year - a.year).slice(0, 14)}
          loading={loading}
        />
        <MovieRow
          title="Trending This Week"
          subtitle="Top charts updated weekly"
          movies={trendingThisWeek}
          loading={loading}
          showRank
          seeAllTo="/trending"
        />

        {CATEGORY_ROWS.map((row) => (
          <MovieRow
            key={row.title}
            title={row.title}
            movies={movies.filter((movie) => movie.genres.some((g) => row.genres.includes(g)))}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}
