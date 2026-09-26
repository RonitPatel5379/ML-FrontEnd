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
import {
  fetchMlRecommendations,
  fetchIndianHeroMovies,
  isBackendOnline,
  subscribeBackendStatus,
  ensureLiveApiConnected,
} from "../services/mlApi";

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
  const [backendStatusOnline, setBackendStatusOnline] = useState(() => isBackendOnline() || backendReady);

  // Guarantee connection to the live Render API is active and monitored
  useEffect(() => {
    void ensureLiveApiConnected();
    const unsub = subscribeBackendStatus(({ online }) => {
      setBackendStatusOnline(online);
    });
    return () => unsub();
  }, []);

  const isLiveApiConnected = backendStatusOnline || backendReady || isBackendOnline();

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
        limit: 15,
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

  // Determine active movie ID stably from actual watched / viewed history.
  // Strictly returns null if user has not watched or viewed any movie yet.
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

    // 3. User's watched history
    if (watched?.length) {
      return watched[0];
    }

    return null;
  }, [recent, watched]);

  // Resolve movie title stably for live ML model recommendations.
  // If the user has not watched any movie, this remains strictly empty.
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

    // If we have already queried for this exact movie title and have results, avoid redundant network requests
    if (lastQueriedTitleRef.current === activeMovieTitle && backendRecommendations.length > 0) {
      return;
    }

    lastQueriedTitleRef.current = activeMovieTitle;
    let isSubscribed = true;

    // Quietly query the ML model using the watched movie's title
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
  }, [activeMovieTitle, backendReady]);

  // Live ML recommendations are only active if backend returned recommendations for a real watched movie
  const isFromBackend = backendRecommendations.length > 0 && Boolean(sourceMovieTitle);

  const popularMovies = useMemo(
    () => [...movies].sort((a, b) => b.popularity - a.popularity).slice(0, 16),
    [movies],
  );

  const hasCustomPreferences = useMemo(() => {
    const genres = preferences?.genres || [];
    const languages = preferences?.languages || [];
    const period = preferences?.period && preferences.period !== "any" ? preferences.period : null;
    const minRating = Number(preferences?.minRating) || 0;
    return genres.length > 0 || languages.length > 0 || Boolean(period) || minRating > 0;
  }, [preferences]);

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
    return "Curated cinematic gems based on global ratings and popularity";
  }, [preferences]);

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

      <div
        className={`relative z-10 space-y-6 pb-12 ${
          continueWatching.length > 0 ? "-mt-8" : "pt-4 sm:pt-6"
        }`}
      >
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
                    {isFromBackend ? "Render ML Backend Active" : "Personalized For You"}
                  </p>
                  {isLiveApiConnected && (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live API Connected
                    </span>
                  )}
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                  {isFromBackend
                    ? (continueWatching.length > 0
                        ? `Top Picks Based on "${sourceMovieTitle}"`
                        : `Top Live ML Picks Based on "${sourceMovieTitle}"`)
                    : (hasCustomPreferences
                        ? recommendationSubtitle
                        : "Handpicked For You · Discover Your Taste")}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  {isFromBackend
                    ? `Predicted in real-time by the Python FastAPI backend on Render using TF-IDF vectorization and KMeans clusters closest to "${sourceMovieTitle}".`
                    : (hasCustomPreferences
                        ? recommendationDescription
                        : "Welcome to CineVerse! Set your favorite genres and languages in preferences, or start watching any movie to unlock real-time ML recommendations.")}
                </p>
              </div>
              <Link
                to="/preferences"
                className="btn-primary shrink-0 rounded-full px-6 py-3 text-center text-sm font-semibold transition-transform hover:scale-105"
              >
                {hasCustomPreferences ? "Tune recommendations" : "Set your taste preferences"}
              </Link>
            </div>
          </div>
        </section>

        {/* Live Machine Learning recommendations: ONLY displayed if user has watched a movie and predictions exist */}
        {isFromBackend && (
          <MovieRow
            title={
              continueWatching.length > 0
                ? `Because you're watching "${sourceMovieTitle}"`
                : `Recommended By Live ML Model ("${sourceMovieTitle}")`
            }
            subtitle="Real-time ML predictions from https://ml-backend-8unk.onrender.com"
            movies={backendRecommendations}
            loading={loading && !backendRecommendations.length}
            showReason
            seeAllTo="/discover"
          />
        )}

        {/* General taste profile recommendations */}
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

        <MovieRow
          title="Popular Movies"
          movies={popularMovies}
          loading={loading && !popularMovies.length}
          seeAllTo="/discover"
        />
      </div>
    </div>
  );
}
