import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";

import PageHeader from "../components/PageHeader";
import MovieRow from "../components/MovieRow";
import { useAuth } from "../context/AuthContext";
import { useMovies } from "../context/MovieContext";
import { useUser } from "../context/UserContext";
import { buildTasteProfile, topGenres } from "../utils/recommendationEngine";
import { initials } from "../utils/helpers";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — CineVerse" },
      {
        name: "description",
        content:
          "Your CineVerse taste profile: favorite genres, movies watched, watchlist size and average rating.",
      },
      { property: "og:title", content: "Your Profile — CineVerse" },
      { property: "og:description", content: "See how your movie taste breaks down." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { movies } = useMovies();
  const { favorites, watchlist, recent, watched, preferences } = useUser();

  const favoriteMovies = useMemo(
    () =>
      favorites
        .map((id) => movies.find((movie) => movie.id === id))
        .filter(Boolean),
    [favorites, movies],
  );

  const profile = useMemo(
    () => buildTasteProfile({ movies, favorites, watchlist, recent, watched, preferences }),
    [movies, favorites, watchlist, recent, watched, preferences],
  );
  const breakdown = topGenres(profile, 5);

  // Fully watched movies added directly to profile
  const fullWatchedMovies = useMemo(() => {
    return (watched || [])
      .map((id) => movies.find((movie) => movie.id === id))
      .filter(Boolean);
  }, [watched, movies]);

  // Movies currently in progress (unfinished)
  const continueWatchingMovies = useMemo(() => {
    return (recent || [])
      .filter((entry) => (entry.progress ?? 0) < 100 && !(watched || []).includes(entry.id))
      .map((entry) => {
        const movie = movies.find((item) => item.id === entry.id);
        return movie ? { ...movie, progress: entry.progress } : null;
      })
      .filter(Boolean);
  }, [recent, watched, movies]);

  // Average rating calculated strictly from fully watched movies
  const averageRating = fullWatchedMovies.length
    ? (
        fullWatchedMovies.reduce((sum, movie) => sum + (movie.rating || 0), 0) /
        fullWatchedMovies.length
      ).toFixed(1)
    : "—";

  const displayName = user?.name || preferences?.displayName || "Cinephile";
  const displayEmail = user?.email || preferences?.email || "No email available";

  const stats = [
    { label: "Movies watched", value: fullWatchedMovies.length },
    { label: "In watchlist", value: watchlist.length },
    { label: "Favorites", value: favorites.length },
    { label: "Avg. rating (watched)", value: averageRating },
  ];

  return (
    <div>
      <PageHeader eyebrow="Account" title="Your profile" />

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-8">
        <section className="glass card-elevated flex flex-col items-center gap-6 rounded-3xl p-6 sm:flex-row sm:items-center">
          <span
            className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl font-display text-2xl font-black text-primary-foreground shadow-lg"
            style={{ backgroundImage: "var(--gradient-primary)" }}
            aria-hidden="true"
          >
            {initials(displayName) || "CV"}
          </span>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="font-display text-2xl font-bold capitalize">
              {displayName}
            </h2>
            <p className="text-sm text-muted-foreground">{displayEmail}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {(preferences.genres || []).slice(0, 5).map((genre) => (
                <span key={genre} className="rounded-full bg-surface-2 px-3 py-1 text-xs">
                  {genre}
                </span>
              ))}
              {(preferences.genres || []).length === 0 && (
                <span className="text-xs text-muted-foreground">No favorite genres set yet</span>
              )}
            </div>
          </div>
          <Link
            to="/preferences"
            className="btn-primary shrink-0 rounded-full px-6 py-3 text-sm font-semibold"
          >
            Update preferences
          </Link>
        </section>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-5 text-center">
              <p className="font-display text-3xl font-black">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="glass card-elevated rounded-3xl p-6" aria-labelledby="taste">
          <h2 id="taste" className="font-display text-xl font-semibold">
            Favorite genres
          </h2>
          {breakdown.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Favorite a few movies or set your preferences and your taste graph will appear here.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {breakdown.map((entry) => (
                <li key={entry.genre}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{entry.genre}</span>
                    <span className="text-muted-foreground">{entry.share}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${entry.share}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundImage: "var(--gradient-primary)" }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Watched Movies Section */}
      {fullWatchedMovies.length > 0 ? (
        <div className="pb-6">
          <MovieRow
            title="Watched Movies"
            subtitle={`${fullWatchedMovies.length} movie${fullWatchedMovies.length === 1 ? "" : "s"} watched in full`}
            movies={fullWatchedMovies}
          />
        </div>
      ) : (
        <div className="mx-auto max-w-5xl px-4 pb-6 sm:px-8">
          <div className="glass rounded-3xl p-6 text-center">
            <h3 className="font-display text-lg font-semibold">No Watched Movies Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              When you finish watching a full movie, it will be automatically added here to your profile.
            </p>
          </div>
        </div>
      )}

      {/* In-progress movies */}
      {continueWatchingMovies.length > 0 && (
        <div className="pb-6">
          <MovieRow
            title="Continue Watching"
            subtitle="Movies currently in progress"
            movies={continueWatchingMovies}
            showProgress
          />
        </div>
      )}

      <MovieRow title="Your favorites" movies={favoriteMovies} />
    </div>
  );
}
