import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Heart, Play, Share2, Sparkles, Star } from "lucide-react";

import Poster from "../components/Poster";
import MovieRow from "../components/MovieRow";
import EmptyState from "../components/EmptyState";
import { DetailsSkeleton } from "../components/LoadingSpinner";
import { backdropFor } from "../data/backdrops";
import { useMovies } from "../context/MovieContext";
import { useUser } from "../context/UserContext";
import { similarMovies } from "../utils/recommendationEngine";
import { fetchMlRecommendations } from "../services/mlApi";
import { formatMoney, formatRuntime } from "../utils/helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/movie/$id")({
  head: () => ({
    meta: [
      { title: "Movie details — CineVerse" },
      {
        name: "description",
        content: "Ratings and similar movies — everything about this title.",
      },
      { property: "og:title", content: "Movie details — CineVerse" },
      {
        property: "og:description",
        content: "Full movie details and recommendations.",
      },
    ],
  }),
  component: MovieDetails,
});

function MovieDetails() {
  const { id } = useParams({ from: "/movie/$id" });
  const { movies, loading, error, fetchMovieById } = useMovies();
  const [fetchedMovie, setFetchedMovie] = useState(null);
  const [fetchingMovie, setFetchingMovie] = useState(false);
  const {
    inWatchlist,
    isFavorite,
    isWatched,
    toggleWatchlist,
    toggleFavorite,
    trackView,
    recent,
    updateProgress,
  } = useUser();

  const localMovie = useMemo(
    () => movies.find((item) => String(item.id) === String(id)) || null,
    [movies, id],
  );

  // If movie is not in current in-memory list or lacks synopsis, fetch from full dataset / backend
  useEffect(() => {
    let active = true;
    if (!localMovie || !localMovie.overview || localMovie.overview.startsWith("Explore full details")) {
      setFetchingMovie(true);
      fetchMovieById(id)
        .then((m) => {
          if (active && m) setFetchedMovie(m);
        })
        .finally(() => {
          if (active) setFetchingMovie(false);
        });
    }
    return () => {
      active = false;
    };
  }, [id, localMovie, fetchMovieById]);

  const movie = localMovie || fetchedMovie;

  useEffect(() => {
    // Only track viewing if movie exists and is not already full watched
    if (movie && !isWatched(movie.id)) {
      trackView(movie);
    }
    window.scrollTo({ top: 0 });
  }, [movie, isWatched, trackView]);

  const recentEntry = useMemo(
    () => (recent || []).find((entry) => entry.id === movie?.id),
    [recent, movie?.id],
  );
  const currentProgress = recentEntry?.progress ?? (movie && !isWatched(movie.id) ? 35 : null);

  const similar = useMemo(() => similarMovies(movie, movies, 12), [movie, movies]);

  const [mlRecommendations, setMlRecommendations] = useState([]);
  const [mlLoading, setMlLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (movie?.title) {
      setMlLoading(true);
      fetchMlRecommendations(movie.title, 12)
        .then((recs) => {
          if (active && recs && recs.length > 0) {
            setMlRecommendations(recs);
          }
        })
        .finally(() => {
          if (active) setMlLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [movie?.title]);

  if (loading || fetchingMovie) return <DetailsSkeleton />;

  if (error || !movie) {
    return (
      <div className="px-4 pt-36 pb-16">
        <EmptyState
          title="We couldn't find that movie."
          description="The title may have been removed, or the link is incorrect."
          actionLabel="Back to discover"
        />
      </div>
    );
  }

  const saved = inWatchlist(movie.id);
  const loved = isFavorite(movie.id);
  const fullWatched = isWatched(movie.id);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: movie.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      toast.message("Sharing cancelled");
    }
  };

  const handleWatchTrailer = () => {
    if (!fullWatched) {
      const current = currentProgress || 35;
      const nextProgress = Math.min(100, current + 35);
      updateProgress(movie, nextProgress);
      if (nextProgress >= 100) {
        toast.success("Movie watched in full", {
          description: `${movie.title} has been added to your Profile section.`,
        });
      } else {
        toast.info(`Playing trailer · ${nextProgress}% watched`, {
          description: "Watching progress is counted internally.",
        });
      }
    } else {
      toast.info("Playing trailer", {
        description: `${movie.title} is already in your Profile's watched movies.`,
      });
    }
  };

  // Normalise fields — backend objects use the same shape via normalizeMlMovie()
  // but we guard here for any legacy or partially-merged objects.
  const safeGenres = Array.isArray(movie.genres) ? movie.genres : [];
  const safeRating = Number((movie.rating ?? movie.vote_average ?? 0).toFixed(1));
  const safeYear = movie.year || movie.release_year || "";
  const safeLanguage = movie.language || (movie.original_language === "en" ? "English" : movie.original_language) || "—";

  const info = [
    { label: "Language", value: safeLanguage },
    { label: "Budget", value: formatMoney(movie.budget) },
    { label: "Revenue", value: formatMoney(movie.revenue) },
    { label: "Popularity", value: `${movie.popularity || 0} pts` },
  ];

  return (
    <article>
      <section className="relative min-h-[70vh] overflow-hidden pt-32 pb-16">
        <img
          src={backdropFor(movie)}
          alt={`${movie.title} backdrop`}
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-scrim absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-8 lg:flex-row lg:items-end"
        >
          <div className="w-40 shrink-0 sm:w-52">
            <div className="card-elevated aspect-[2/3] overflow-hidden rounded-3xl border border-border">
              <Poster movie={movie} className="h-full w-full" eager />
            </div>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-display text-4xl font-black text-balance sm:text-5xl">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="mt-2 text-sm text-muted-foreground italic">{movie.tagline}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-semibold text-gold">
                <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                {safeRating.toFixed(1)}
                <span className="text-muted-foreground">/10</span>
              </span>
              <span>{safeYear}</span>
              <span>{formatRuntime(movie.runtime)}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {safeGenres.map((genre) => (
                <span key={genre} className="glass rounded-full px-3 py-1 text-xs">
                  {genre}
                </span>
              ))}
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {movie.overview}
            </p>

            {/* Continue Watching status & playback progress */}
            {!fullWatched && currentProgress !== null && (
              <div className="mt-6 rounded-2xl glass p-4 max-w-xl border border-primary/20">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary-glow flex items-center gap-1.5">
                    <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    In Continue Watching · {currentProgress}% watched
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Watching progress counted internally
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${currentProgress}%`,
                      backgroundImage: "var(--gradient-primary)",
                    }}
                  />
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleWatchTrailer}
                className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg hover:scale-105 transition-all"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                Watch Trailer
              </button>
              <button
                type="button"
                onClick={() => toggleWatchlist(movie)}
                className="btn-glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {saved ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : (
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                )}
                {saved ? "In Watchlist" : "Add to Watchlist"}
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(movie)}
                aria-pressed={loved}
                className="btn-glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                <Heart
                  className={`h-4 w-4 ${loved ? "fill-current text-destructive" : ""}`}
                  aria-hidden="true"
                />
                {loved ? "Favorited" : "Favorite"}
              </button>
              <button
                type="button"
                onClick={share}
                className="btn-glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                Share
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8" aria-labelledby="movie-info">
        <h2 id="movie-info" className="font-display text-2xl font-bold">
          Movie information
        </h2>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {info.map((item) => (
            <div key={item.label} className="glass rounded-2xl p-4">
              <dt className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                {item.label}
              </dt>
              <dd className="mt-2 text-sm font-medium">{item.value || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>

      {mlRecommendations.length > 0 ? (
        <>
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Machine Learning Powered ({mlRecommendations.length} Recommendations)
            </span>
          </div>
          <MovieRow
            title="AI Recommended Movies"
            subtitle="Trained TF-IDF & KMeans clusters from Render ML backend"
            movies={mlRecommendations}
          />
          <MovieRow
            title="More Similar Titles"
            subtitle="Content-based genre and popularity similarity"
            movies={similar}
          />
        </>
      ) : (
        <MovieRow
          title="Similar movies"
          subtitle="Same wavelength, different story"
          movies={similar}
        />
      )}
    </article>
  );
}
