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
import { INDIAN_MOVIES } from "../data/indianMovies";
import { isIndianMovie } from "../data/genres";
import { recommendMovies } from "../utils/recommendationEngine";
import { seeded } from "../utils/helpers";
import { fetchMlRecommendations, fetchIndianHeroMovies } from "../services/mlApi";

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

function Home() {
  const { movies, loading, error, reload, backendReady } = useMovies();
  const { favorites, watchlist, recent, watched, preferences } = useUser();
  const [apiIndianMovies, setApiIndianMovies] = useState([]);

  // Fetch real Indian movies from the live Render API
  useEffect(() => {
    let active = true;
    fetchIndianHeroMovies({ limit: 15 }).then((items) => {
      if (active && items && items.length > 0) {
        setApiIndianMovies(items);
      }
    });
    return () => {
      active = false;
    };
  }, [backendReady]);

  // Exactly 5 Indian movies rotated daily below the navbar in the Hero carousel
  const featured = useMemo(() => {
    // Collect candidate pool prioritizing Indian movies directly from the live API
    const apiPool = (apiIndianMovies || []).filter(isIndianMovie);
    const contextPool = (movies || []).filter(isIndianMovie);
    const fallbackPool = (INDIAN_MOVIES || []).filter(isIndianMovie);

    // Merge: live API first, then context loaded movies, then curated Indian films
    const candidateList = [...apiPool, ...contextPool, ...fallbackPool];

    // Deduplicate by normalized title and guarantee EVERY movie is an Indian movie
    const seen = new Set();
    const indianPool = [];
    for (const movie of candidateList) {
      if (!isIndianMovie(movie)) continue;
      const key = (movie.title || "").trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        indianPool.push(movie);
      }
    }

    if (indianPool.length === 0) return [];

    // Unique deterministic seed for the current calendar day (changes every single day)
    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // Score and shuffle deterministically for each day
    const scored = indianPool.map((movie, index) => {
      const idNum =
        typeof movie.id === "number"
          ? movie.id
          : (movie.title || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return {
        movie,
        score: seeded(daySeed * 997 + idNum * 31 + index),
      };
    });

    scored.sort((a, b) => b.score - a.score);
    // Strictly return the 5 Indian movies for today
    return scored.slice(0, 5).map((item) => item.movie);
  }, [apiIndianMovies, movies]);

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

  // Resolve movie title stably for live ML model recommendations
  const activeMovieTitle = useMemo(() => {
    if (!activeMovieId) {
      // If user hasn't watched anything yet, use their favorite or default seed title ("Inception")
      // so the live ML API is immediately queried upon login
      if (favorites?.length) {
        const favId = favorites[0];
        const match = movies.find((m) => String(m.id) === String(favId));
        if (match?.title) return match.title;
      }
      const match = movies.find((m) => m.title?.toLowerCase().includes("inception")) || movies[0];
      return match?.title || "Inception";
    }
    const fromLoaded = movies.find((m) => String(m.id) === String(activeMovieId));
    if (fromLoaded?.title) return fromLoaded.title;
    const fromCurated = MOVIES.find((m) => String(m.id) === String(activeMovieId));
    return fromCurated?.title || "Inception";
  }, [activeMovieId, favorites, movies]);

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

    // If we have already queried for this exact movie title and have results, avoid redundant network requests
    if (lastQueriedTitleRef.current === activeMovieTitle && backendRecommendations.length > 0) {
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
  }, [activeMovieTitle, backendReady, backendRecommendations.length]);

  const isFromBackend = backendRecommendations.length > 0;

  const popularMovies = useMemo(
    () => [...movies].sort((a, b) => b.popularity - a.popularity).slice(4, 18),
    [movies],
  );

  const recommendationSubtitle = useMemo(() => {
    const genres = preferences?.genres || [];
    const languages = preferences?.languages || [];
    const period = preferences?.period && preferences.period !== "any" ? preferences.period : null;

    if (languages.length > 0 && genres.length > 0) {
      return `Curated for: ${languages.join(", ")} · ${genres.slice(0, 3).join(", ")}`;
    }
    if (genres.length > 0) {
      return `Curated for your favorite genres: ${genres.slice(0, 3).join(", ")}`;
    }
    if (languages.length > 0) {
      return `Curated for your preferred languages: ${languages.join(", ")}`;
    }
    if (period) {
      return `Top recommendations from ${period} and newer`;
    }
    return recommendations[0]?.reason || "Tuned to your taste profile";
  }, [preferences, recommendations]);

  const recommendationDescription = useMemo(() => {
    const genres = preferences?.genres || [];
    const languages = preferences?.languages || [];
    if (languages.length > 0 || genres.length > 0) {
      const parts = [];
      if (genres.length > 0) parts.push(`genres (${genres.join(", ")})`);
      if (languages.length > 0) parts.push(`language (${languages.join(", ")})`);
      return `Personalized specifically to match your preferred ${parts.join(" and ")}.`;
    }
    return "Our engine blends genre affinity, ratings, popularity and your recent activity into a single score.";
  }, [preferences]);

  const [highlightTaste, setHighlightTaste] = useState(false);

  // Smooth scroll to "Because your taste says so" section when redirected from preferences
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkAndScroll = () => {
      const hash = window.location.hash;
      if (
        hash === "#because-your-taste-says-so" ||
        hash === "#taste-recommendations" ||
        hash === "#taste"
      ) {
        const target =
          document.getElementById("because-your-taste-says-so") ||
          document.getElementById("taste-recommendations") ||
          document.getElementById("row-Because-your-taste-says-so");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          setHighlightTaste(true);
          setTimeout(() => setHighlightTaste(false), 2600);
        }
      }
    };

    checkAndScroll();
    const t1 = setTimeout(checkAndScroll, 120);
    const t2 = setTimeout(checkAndScroll, 400);
    const t3 = setTimeout(checkAndScroll, 900);

    window.addEventListener("hashchange", checkAndScroll);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("hashchange", checkAndScroll);
    };
  }, []);

  if (error) {
    return (
      <div className="px-4 pt-32 pb-16">
        <ErrorState description={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div>
      {loading && !featured.length ? <HeroSkeleton /> : <Hero movies={featured} />}

      <div className="relative z-10 -mt-10 space-y-2 pb-10">
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
                  {(isFromBackend || backendReady) && (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                      Live API Connected
                    </span>
                  )}
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                  {isFromBackend
                    ? (activeMovieId ? `Top Picks Based on "${sourceMovieTitle}"` : `Top Live ML Picks Based on "${sourceMovieTitle}"`)
                    : recommendationSubtitle}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  {isFromBackend
                    ? `Predicted in real-time by the Python FastAPI backend on Render using TF-IDF vectorization and KMeans clusters closest to "${sourceMovieTitle}".`
                    : recommendationDescription}
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
          id={!isFromBackend ? "because-your-taste-says-so" : undefined}
          className={
            !isFromBackend && highlightTaste
              ? "rounded-3xl bg-primary/10 ring-2 ring-primary/40 p-2 shadow-2xl transition-all duration-700"
              : ""
          }
          title={
            isFromBackend
              ? (activeMovieId ? `Because you're watching "${sourceMovieTitle}"` : `Recommended By Live ML Model ("${sourceMovieTitle}")`)
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
            id="because-your-taste-says-so"
            className={
              highlightTaste
                ? "rounded-3xl bg-primary/10 ring-2 ring-primary/40 p-2 shadow-2xl transition-all duration-700"
                : ""
            }
            title="Because your taste says so"
            subtitle={recommendationSubtitle}
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
      </div>
    </div>
  );
}
