import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorState({
  title = "Something went wrong",
  description = "Unable to load movies right now.",
  onRetry,
}) {
  return (
    <div
      role="alert"
      className="glass card-elevated mx-auto flex max-w-lg flex-col items-center rounded-3xl px-8 py-12 text-center"
    >
      <AlertTriangle className="mb-4 h-10 w-10 text-destructive" aria-hidden="true" />
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}
