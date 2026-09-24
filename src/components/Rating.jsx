import { Star } from "lucide-react";

export default function Rating({ value, size = "sm", showMax = false }) {
  const dims = size === "lg" ? "text-base" : "text-xs";
  const icon = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold text-gold ${dims}`}
      aria-label={`Rated ${value} out of 10`}
    >
      <Star className={`${icon} fill-current`} aria-hidden="true" />
      {Number(value).toFixed(1)}
      {showMax && <span className="text-muted-foreground">/10</span>}
    </span>
  );
}
