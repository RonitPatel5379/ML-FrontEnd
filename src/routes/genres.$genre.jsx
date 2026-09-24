import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import PageHeader from "../components/PageHeader";
import MovieGrid from "../components/MovieGrid";
import { useMovies } from "../context/MovieContext";
import { genreFromSlug } from "../data/genres";

export const Route = createFileRoute("/genres/$genre")({
  head: ({ params }) => {
    const name = genreFromSlug(params.genre) || "Genre";
    return {
      meta: [
        { title: `${name} Movies — CineVerse` },
        {
          name: "description",
          content: `Browse the best ${name.toLowerCase()} movies on CineVerse, sorted by rating, year or popularity.`,
        },
        { property: "og:title", content: `${name} Movies — CineVerse` },
        {
          property: "og:description",
          content: `Handpicked ${name.toLowerCase()} movies with ratings, runtimes and recommendations.`,
        },
      ],
    };
  },
  component: GenreResults,
});

const SORTS = [
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
  { value: "az", label: "A–Z" },
];

function GenreResults() {
  const { genre: slug } = useParams({ from: "/genres/$genre" });
  const { movies, loading } = useMovies();
  const [sort, setSort] = useState("rating");
  const name = genreFromSlug(slug);

  const results = useMemo(() => {
    const list = movies.filter((movie) => movie.genres.includes(name));
    const sorters = {
      rating: (a, b) => b.rating - a.rating,
      newest: (a, b) => b.year - a.year,
      az: (a, b) => a.title.localeCompare(b.title),
    };
    const sorter = sorters[sort] || sorters.rating;
    return [...list].sort(sorter);
  }, [movies, name, sort]);

  return (
    <div>
      <PageHeader
        eyebrow="Genre"
        title={name ? `${name} movies` : "Unknown genre"}
        description={
          name
            ? `${results.length} handpicked ${name.toLowerCase()} titles, ranked for your evening.`
            : "That genre doesn't exist in our catalog yet."
        }
      >
        <div className="glass inline-flex rounded-full p-1">
          {SORTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSort(option.value)}
              aria-pressed={sort === option.value}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                sort === option.value ? "btn-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <MovieGrid
          movies={results}
          loading={loading}
          emptyTitle="No movies in this genre yet"
          emptyDescription="Try another genre or explore what's trending right now."
        />
      </div>
    </div>
  );
}
