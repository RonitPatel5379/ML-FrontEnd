import { Film } from "lucide-react";

export default function Poster({ movie, className = "", eager = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[inherit] bg-surface ${className}`}
    >
      <div className="absolute inset-0 grid place-items-center bg-surface-2 p-4 text-center">
        <div>
          <Film className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-xs font-semibold text-muted-foreground">Poster unavailable</p>
        </div>
      </div>
      {movie?.remotePoster ? (
        <img
          src={movie.remotePoster}
          alt={`${movie.title} poster`}
          loading={eager ? "eager" : "lazy"}
          className="relative h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}
