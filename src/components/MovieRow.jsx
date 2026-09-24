import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

import MovieCard from "./MovieCard";
import { RowSkeleton } from "./LoadingSpinner";

export default function MovieRow({
  title,
  subtitle,
  movies = [],
  loading = false,
  showRank = false,
  showProgress = false,
  showReason = false,
  seeAllTo,
}) {
  const scroller = useRef(null);

  const scrollBy = (direction) => {
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "smooth" });
  };

  if (loading) {
    return (
      <section className="py-6">
        <div className="mb-4 px-4 sm:px-8">
          <div className="shimmer h-6 w-48 rounded-full" />
        </div>
        <RowSkeleton />
      </section>
    );
  }

  if (!movies.length) return null;

  return (
    <section className="py-6" aria-labelledby={`row-${title.replace(/\s+/g, "-")}`}>
      <header className="mb-4 flex items-end justify-between gap-4 px-4 sm:px-8">
        <div>
          <h2
            id={`row-${title.replace(/\s+/g, "-")}`}
            className="font-display text-xl font-semibold sm:text-2xl"
          >
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {seeAllTo && (
            <Link
              to={seeAllTo}
              className="hidden text-xs font-semibold text-primary-glow hover:underline sm:block"
            >
              See all
            </Link>
          )}
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label={`Scroll ${title} left`}
            className="btn-glass hidden h-9 w-9 place-items-center rounded-full sm:grid"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label={`Scroll ${title} right`}
            className="btn-glass hidden h-9 w-9 place-items-center rounded-full sm:grid"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        ref={scroller}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-8"
      >
        {movies.map((movie, index) => (
          <div key={movie.id} className="snap-start">
            <MovieCard
              movie={movie}
              rank={showRank ? index + 1 : undefined}
              progress={showProgress ? movie.progress : undefined}
              reason={showReason ? movie.reason : undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
