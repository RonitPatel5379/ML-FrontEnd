/** Polished skeleton loaders + a small inline spinner. */

export function LoadingSpinner({ label = "Loading" }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function CardSkeleton() {
  return (
    <div className="w-[46vw] shrink-0 sm:w-52">
      <div className="shimmer aspect-[2/3] rounded-2xl" />
      <div className="shimmer mt-3 h-4 w-3/4 rounded-full" />
      <div className="shimmer mt-2 h-3 w-1/2 rounded-full" />
    </div>
  );
}

export function RowSkeleton({ count = 6 }) {
  return (
    <div className="flex gap-4 overflow-hidden px-4 sm:px-8">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <div className="shimmer aspect-[2/3] rounded-2xl" />
          <div className="shimmer mt-3 h-4 w-3/4 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[78vh] min-h-[520px] w-full overflow-hidden">
      <div className="shimmer absolute inset-0" />
      <div className="absolute bottom-16 left-4 max-w-xl space-y-4 sm:left-10">
        <div className="shimmer h-4 w-32 rounded-full" />
        <div className="shimmer h-12 w-80 rounded-2xl" />
        <div className="shimmer h-4 w-full rounded-full" />
        <div className="shimmer h-4 w-2/3 rounded-full" />
        <div className="shimmer h-12 w-64 rounded-full" />
      </div>
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div>
      <HeroSkeleton />
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-12 sm:px-8">
        <div className="shimmer h-5 w-48 rounded-full" />
        <div className="shimmer h-4 w-full rounded-full" />
        <div className="shimmer h-4 w-5/6 rounded-full" />
      </div>
    </div>
  );
}

export default LoadingSpinner;
