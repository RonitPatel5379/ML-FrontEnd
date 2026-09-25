import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import Hero from "../components/Hero";
import MovieRow from "../components/MovieRow";
import ErrorState from "../components/ErrorState";
import { HeroSkeleton } from "../components/LoadingSpinner";
import { useMovies } from "../context/MovieContext";
import { useUser } from "../context/UserContext";
import { MOVIES } from "../data/movies";
import { recommendMovies } from "../utils/recommendationEngine";
import { getRankedTrendingMovies } from "../utils/trending";
import { seeded } from "../utils/helpers";
import { fetchMlRecommendations } from "../services/mlApi";

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
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

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

  const [backendRecommendations, setBackendRecommendations] = useState([]);
  const [sourceMovieTitle, setSourceMovieTitle] = useState("");

  // Determine active movie ID stably (does not change on playback percentage ticks)
  const activeMovieId = useMemo(() => {
    // 1. Current movie in Continue Watching (in progress, unwatched)
    const inProgress = (recent || []).find(
      (entry) => (entry.progress ?? 0) < 100 && !(watched || []).includes(entry.id),
    );
    if (inProgress?.id) return inProgress.id;

    // 2. Most recently viewed movie in history
    if (recent?.length) {
      const firstRecent = recent[0];
      return firstRecent?.id ?? firstRecent;
    }

    // 3. User's top favorite movie
    if (favorites?.length) {
      return favorites[0];
    }

    return null;
  }, [recent, watched, favorites]);

  // Resolve movie title stably
  const activeMovieTitle = useMemo(() => {
    if (!activeMovieId) return "";
    const fromLoaded = movies.find((m) => String(m.id) === String(activeMovieId));
    if (fromLoaded?.title) return fromLoaded.title;
    const fromCurated = MOVIES.find((m) => String(m.id) === String(activeMovieId));
    return fromCurated?.title || "";
  }, [activeMovieId, movies]);

  const lastQueriedTitleRef = useRef("");
  const moviesRef = useRef(movies);
  moviesRef.current = movies;

  useEffect(() => {
    if (!activeMovieTitle) {
      lastQueriedTitleRef.current = "";
      setBackendRecommendations([]);
      setSourceMovieTitle("");
      return;
    }

    // If we have already queried for this exact movie title, avoid redundant network requests
    if (lastQueriedTitleRef.current === activeMovieTitle) {
      return;
    }

    lastQueriedTitleRef.current = activeMovieTitle;
    let isSubscribed = true;

    // Quietly query the ML model without triggering constant screen refreshes or skeleton flickers
    fetchMlRecommendations(activeMovieTitle, 14, moviesRef.current)
      .then((recs) => {
        if (isSubscribed) {
          if (recs && recs.length > 0) {
            setBackendRecommendations(recs);
            setSourceMovieTitle(activeMovieTitle);
          } else {
            setBackendRecommendations([]);
          }
        }
      })
      .catch((err) => {
        console.warn("[Home] ML backend query error:", err);
        if (isSubscribed) setBackendRecommendations([]);
      });

    return () => {
      isSubscribed = false;
    };
  }, [activeMovieTitle]);

  const isFromBackend = backendRecommendations.length > 0;

  const trendingToday = useMemo(
    () => getRankedTrendingMovies(movies, "today").slice(0, 14),
    [movies],
  );

  const trendingThisWeek = useMemo(
    () => getRankedTrendingMovies(movies, "week").slice(0, 14),
    [movies],
  );

  const popularMovies = useMemo(
    () => [...movies].sort((a, b) => b.popularity - a.popularity).slice(4, 18),
    [movies],
  );

  const topRatedMovies = useMemo(
    () => [...movies].sort((a, b) => b.rating - a.rating).slice(0, 14),
    [movies],
  );

  const newReleasesMovies = useMemo(
    () => [...movies].sort((a, b) => b.year - a.year).slice(0, 14),
    [movies],
  );

  const categoryRows = useMemo(
    () =>
      CATEGORY_ROWS.map((row) => ({
        title: row.title,
        movies: movies
          .filter((movie) => Array.isArray(movie.genres) && movie.genres.some((g) => row.genres.includes(g)))
          .slice(0, 14),
      })),
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
            <div className="glass card-elevated flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between border border-primary/20">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] text-primary-glow uppercase">
                    <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    {isFromBackend ? "Render ML Backend Active" : "Recommended For You"}
                  </p>
                  {isFromBackend && (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                      Live API Connected
                    </span>
                  )}
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                  {isFromBackend
                    ? `Top Picks Based on "${sourceMovieTitle}"`
                    : recommendationSubtitle}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  {isFromBackend
                    ? `Predicted in real-time by the Python FastAPI backend on Render using TF-IDF vectorization and KMeans clusters closest to "${sourceMovieTitle}".`
                    : "Our engine blends genre affinity, ratings, popularity and your recent activity into a single score."}
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

        {/* Live Machine Learning recommendations from the Render backend */}
        <MovieRow
          title={
            isFromBackend
              ? `Because you're watching "${sourceMovieTitle}"`
              : "Because your taste says so"
          }
          subtitle={
            isFromBackend
              ? `Real-time ML predictions from https://ml-backend-8unk.onrender.com`
              : recommendationSubtitle
          }
          movies={isFromBackend ? backendRecommendations : recommendations}
          loading={loading && !backendRecommendations.length && !recommendations.length}
          showReason
          seeAllTo="/discover"
        />

        {/* Also display general taste profile recommendations when backend ML row is active */}
        {isFromBackend && (
          <MovieRow
            title="Because your taste says so"
            subtitle="Overall profile affinity across your favorite genres and history"
            movies={recommendations}
            loading={loading && !recommendations.length}
            showReason
            seeAllTo="/discover"
          />
        )}

        <MovieRow
          title="Popular Movies"
          movies={popularMovies}
          loading={loading && !popularMovies.length}
        />
        <MovieRow
          title="Top Rated"
          movies={topRatedMovies}
          loading={loading && !topRatedMovies.length}
        />
        <MovieRow
          title="New Releases"
          movies={newReleasesMovies}
          loading={loading && !newReleasesMovies.length}
        />
        <MovieRow
          title="Trending This Week"
          subtitle="Top charts updated weekly"
          movies={trendingThisWeek}
          loading={loading && !trendingThisWeek.length}
          showRank
          seeAllTo="/trending"
        />

        {categoryRows.map((row) => (
          <MovieRow
            key={row.title}
            title={row.title}
            movies={row.movies}
            loading={loading && !row.movies.length}
          />
        ))}
      </div>
    </div>
  );
}
