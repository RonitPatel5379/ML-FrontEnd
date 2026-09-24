import { createFileRoute } from "@tanstack/react-router";

import PageHeader from "../components/PageHeader";
import GenreCard from "../components/GenreCard";
import { GridSkeleton } from "../components/LoadingSpinner";
import { useMovies } from "../context/MovieContext";

export const Route = createFileRoute("/genres/")({
  head: () => ({
    meta: [
      { title: "Browse Genres — CineVerse" },
      {
        name: "description",
        content:
          "Browse movies by genre — action, sci-fi, horror, romance, animation and more on CineVerse.",
      },
      { property: "og:title", content: "Browse Genres — CineVerse" },
      {
        property: "og:description",
        content: "Cinematic genre collections curated for every mood.",
      },
    ],
  }),
  component: Genres,
});

function Genres() {
  const { genreCounts, loading } = useMovies();

  return (
    <div>
      <PageHeader
        eyebrow="Genres"
        title="Pick a mood, we'll pick the movies"
        description="Every genre is a curated shelf — dive in and let CineVerse do the rest."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        {loading ? (
          <GridSkeleton count={9} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {genreCounts.map(({ genre, count }) => (
              <GenreCard key={genre} genre={genre} count={count} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
