import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Heart } from "lucide-react";

import PageHeader from "../components/PageHeader";
import MovieGrid from "../components/MovieGrid";
import EmptyState from "../components/EmptyState";
import MovieRow from "../components/MovieRow";
import { useMovies } from "../context/MovieContext";
import { useUser } from "../context/UserContext";
import { recommendMovies } from "../utils/recommendationEngine";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "My Favorites — CineVerse" },
      {
        name: "description",
        content: "The movies you love most, saved on this device and used to sharpen your picks.",
      },
      { property: "og:title", content: "My Favorites — CineVerse" },
      { property: "og:description", content: "Your favorite movies collection on CineVerse." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { movies, loading } = useMovies();
  const { favorites, watchlist, recent, watched, preferences } = useUser();

  const items = useMemo(
    () => favorites.map((id) => movies.find((movie) => movie.id === id)).filter(Boolean),
    [favorites, movies],
  );

  const becauseYouLoved = useMemo(
    () =>
      favorites.length
        ? recommendMovies({ movies, favorites, watchlist, recent, watched, preferences, limit: 12 })
        : [],
    [movies, favorites, watchlist, recent, watched, preferences],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Your space"
        title="Favorites"
        description={
          items.length
            ? `${items.length} ${items.length === 1 ? "movie" : "movies"} you rated as unmissable.`
            : "Tap the heart on any movie to keep it here forever."
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        {items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No favorites yet."
            description="Heart the movies you love and CineVerse will learn your taste instantly."
            actionLabel="Find something to love"
          />
        ) : (
          <MovieGrid movies={items} loading={loading} />
        )}
      </div>

      {becauseYouLoved.length > 0 && (
        <MovieRow
          title="Because you loved these"
          subtitle="Fresh picks from your favorite genres"
          movies={becauseYouLoved}
          showReason
        />
      )}
    </div>
  );
}
