import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { genreSlug } from "../data/genres";

export const GENRE_POSTERS = {
  Action: "/posters/4.jpg", // The Dark Knight
  Adventure: "/posters/3.jpg", // Mad Max: Fury Road
  Animation: "/posters/9.jpg", // Spider-Man: Into the Spider-Verse
  Comedy: "/posters/51.jpg", // 3 Idiots
  Crime: "/posters/13.jpg", // The Godfather
  Documentary: "/posters/40.jpg", // Free Solo
  Drama: "/posters/10.jpg", // Whiplash
  Fantasy: "/posters/6.jpg", // Spirited Away
  Horror: "/posters/94.jpg", // Tumbbad
  Mystery: "/posters/15.jpg", // The Prestige
  Romance: "/posters/12.jpg", // La La Land
  "Sci-Fi": "/posters/1.jpg", // Interstellar
  Thriller: "/posters/5.jpg", // Parasite
};

export default function GenreCard({ genre, count, poster }) {
  const image = poster || GENRE_POSTERS[genre] || "/posters/1.jpg";

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 240, damping: 20 }}>
      <Link
        to="/genres/$genre"
        params={{ genre: genreSlug(genre) }}
        className="group card-elevated relative block aspect-[16/10] overflow-hidden rounded-3xl border border-border"
        aria-label={`${genre} — ${count} movies`}
      >
        <img
          src={image}
          alt={`${genre} genre poster`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20 transition-opacity duration-300 group-hover:via-background/50" />

        <div className="absolute top-4 right-4 z-10">
          <span className="glass rounded-full px-3 py-1 text-xs font-semibold text-foreground/90 shadow-sm">
            {count} titles
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 p-5">
          <h3 className="font-display text-2xl font-bold transition-colors group-hover:text-primary-glow">
            {genre}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
            <span>Explore collection</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
