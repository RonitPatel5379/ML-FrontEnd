import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Heart, Play } from "lucide-react";

import Poster from "./Poster";
import Rating from "./Rating";
import { useUser } from "../context/UserContext";

export default function MovieCard({ movie, width = "row", rank, progress, reason }) {
  const { inWatchlist, isFavorite, toggleWatchlist, toggleFavorite } = useUser();
  const saved = inWatchlist(movie.id);
  const loved = isFavorite(movie.id);

  const sizing =
    width === "grid" ? "w-full" : "w-[46vw] shrink-0 sm:w-52 lg:w-56";

  return (
    <motion.article
      whileHover={{ scale: 1.04, y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`group relative ${sizing}`}
    >
      <Link
        to="/movie/$id"
        params={{ id: String(movie.id) }}
        className="block rounded-2xl focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`${movie.title}, ${movie.year}, rated ${movie.rating}`}
      >
        <div className="card-elevated relative aspect-[2/3] overflow-hidden rounded-2xl ring-1 ring-inset ring-white/5">
          <Poster movie={movie} className="h-full w-full" />

          {rank && (
            <span className="absolute top-0 left-2 font-display text-5xl font-black text-foreground/25 tabular-nums">
              {String(rank).padStart(2, "0")}
            </span>
          )}

          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background via-background/45 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
            <p className="mb-3 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
              {movie.overview}
            </p>
            <div className="flex items-center gap-2">
              <span
                className="btn-primary grid h-9 w-9 place-items-center rounded-full"
                title="Watch Trailer — View Movie Info"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleWatchlist(movie);
                }}
                aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
                className="btn-glass grid h-9 w-9 place-items-center rounded-full"
              >
                {saved ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : (
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleFavorite(movie);
                }}
                aria-label={loved ? "Remove from favorites" : "Add to favorites"}
                className="btn-glass grid h-9 w-9 place-items-center rounded-full"
              >
                <Heart
                  className={`h-4 w-4 ${loved ? "fill-current text-destructive" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <span className="glass absolute top-2 right-2 rounded-full px-2 py-1">
            <Rating value={movie.rating} />
          </span>
        </div>

        {typeof progress === "number" && (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundImage: "var(--gradient-primary)" }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{progress}% watched</span>
            </div>
          </div>
        )}

        <div className="mt-3">
          <h3 className="truncate text-sm font-semibold">{movie.title}</h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {movie.year} · {movie.genres.slice(0, 2).join(", ")}
          </p>
          {reason && <p className="mt-1 truncate text-[11px] text-primary-glow">{reason}</p>}
        </div>
      </Link>
    </motion.article>
  );
}
