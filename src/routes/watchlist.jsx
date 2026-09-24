import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Bookmark, Eye, Trash2 } from "lucide-react";

import PageHeader from "../components/PageHeader";
import Poster from "../components/Poster";
import Rating from "../components/Rating";
import EmptyState from "../components/EmptyState";
import { useMovies } from "../context/MovieContext";
import { useUser } from "../context/UserContext";
import { formatRuntime } from "../utils/helpers";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "My Watchlist — CineVerse" },
      {
        name: "description",
        content: "Everything you saved for later, with runtimes, ratings and watched status.",
      },
      { property: "og:title", content: "My Watchlist — CineVerse" },
      { property: "og:description", content: "Your saved movies, ready when you are." },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { movies } = useMovies();
  const { watchlist, toggleWatchlist, markWatched } = useUser();

  const items = useMemo(
    () => watchlist.map((id) => movies.find((movie) => movie.id === id)).filter(Boolean),
    [watchlist, movies],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Your space"
        title="My Watchlist"
        description={
          items.length
            ? `${items.length} ${items.length === 1 ? "movie" : "movies"} queued up for later.`
            : "Save movies as you browse and they'll show up here."
        }
      />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        {items.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="Your watchlist is waiting."
            description="Browse trending titles or let our recommendation engine suggest something."
            actionLabel="Discover movies"
          />
        ) : (
          <ul className="space-y-4">
            {items.map((movie, index) => (
              <motion.li
                key={movie.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="glass card-elevated flex items-center gap-4 rounded-3xl p-4"
              >
                <Link
                  to="/movie/$id"
                  params={{ id: String(movie.id) }}
                  className="h-24 w-16 shrink-0 overflow-hidden rounded-xl"
                >
                  <Poster movie={movie} className="h-full w-full" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/movie/$id"
                    params={{ id: String(movie.id) }}
                    className="truncate font-display text-lg font-semibold hover:text-primary-glow"
                  >
                    {movie.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <Rating value={movie.rating} />
                    <span>{movie.year}</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                    <span className="truncate">{movie.genres.join(" · ")}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => markWatched(movie)}
                    aria-label={`Mark ${movie.title} as watched`}
                    className="btn-glass grid h-10 w-10 place-items-center rounded-full"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(movie)}
                    aria-label={`Remove ${movie.title} from watchlist`}
                    className="btn-glass grid h-10 w-10 place-items-center rounded-full text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
