import { motion } from "framer-motion";

import MovieCard from "./MovieCard";
import { GridSkeleton } from "./LoadingSpinner";
import EmptyState from "./EmptyState";

export default function MovieGrid({
  movies = [],
  loading = false,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionTo,
  onEmptyAction,
}) {
  if (loading) return <GridSkeleton />;

  if (!movies.length) {
    return (
      <EmptyState
        title={emptyTitle || "We couldn't find that movie."}
        description={emptyDescription || "Try a different title, genre, or loosen your filters."}
        actionLabel={emptyActionLabel || (onEmptyAction ? "Reset filters" : "Browse trending")}
        actionTo={emptyActionTo || "/trending"}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {movies.map((movie, index) => (
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.03, 0.4) }}
        >
          <MovieCard movie={movie} width="grid" reason={movie.reason} />
        </motion.div>
      ))}
    </div>
  );
}
