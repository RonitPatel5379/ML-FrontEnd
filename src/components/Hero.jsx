import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Info, Play, Star } from "lucide-react";

import Poster from "./Poster";
import { backdropFor } from "../data/backdrops";
import { formatRuntime } from "../utils/helpers";
import { useUser } from "../context/UserContext";

export default function Hero({ movies = [], interval = 7000 }) {
  const [index, setIndex] = useState(0);
  const { inWatchlist, toggleWatchlist } = useUser();

  useEffect(() => {
    if (movies.length < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % movies.length), interval);
    return () => clearInterval(timer);
  }, [movies.length, interval]);

  const movie = movies[index];
  if (!movie) return null;
  const saved = inWatchlist(movie.id);

  return (
    <section className="relative h-[86vh] min-h-[560px] w-full overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.img
          key={movie.id}
          src={backdropFor(movie)}
          alt={`${movie.title} backdrop`}
          width={1920}
          height={1088}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
      <div className="hero-scrim absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/30 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-4 pb-16 sm:px-8 sm:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.55 }}
            className="flex w-full items-end gap-8"
          >
            <div className="hidden w-44 shrink-0 lg:block">
              <div className="card-elevated aspect-[2/3] overflow-hidden rounded-2xl border border-border">
                <Poster movie={movie} className="h-full w-full" eager />
              </div>
            </div>

            <div className="max-w-2xl">
              <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-primary-glow uppercase">
                Featured tonight
              </p>
              <h1 className="font-display text-4xl leading-[1.05] font-black text-balance sm:text-6xl">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="mt-3 text-sm text-muted-foreground italic">{movie.tagline}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-semibold text-gold">
                  <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                  {movie.rating.toFixed(1)}
                </span>
                <span>{movie.year}</span>
                <span>{formatRuntime(movie.runtime)}</span>
                <span>{movie.genres.join(" · ")}</span>
              </div>

              <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {movie.overview}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/movie/$id"
                  params={{ id: String(movie.id) }}
                  className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  Watch Trailer
                </Link>
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
                <Link
                  to="/movie/$id"
                  params={{ id: String(movie.id) }}
                  className="btn-glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
                >
                  <Info className="h-4 w-4" aria-hidden="true" />
                  More Details
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {movies.map((item, dotIndex) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(dotIndex)}
            aria-label={`Show ${item.title}`}
            aria-current={dotIndex === index}
            className={`h-1.5 rounded-full transition-all ${
              dotIndex === index ? "w-8 bg-primary" : "w-3 bg-border hover:bg-muted-foreground"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
