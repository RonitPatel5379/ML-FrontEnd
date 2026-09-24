import Rating from "./Rating";
import { formatDate, initials } from "../utils/helpers";

export default function ReviewCard({ review }) {
  return (
    <article className="glass rounded-2xl p-5">
      <header className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-full text-xs font-bold text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-primary)" }}
          aria-hidden="true"
        >
          {initials(review.username)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{review.username}</p>
          <p className="text-xs text-muted-foreground">{formatDate(review.date)}</p>
        </div>
        <Rating value={review.rating} showMax />
      </header>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
    </article>
  );
}
