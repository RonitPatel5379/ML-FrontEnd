/** Small pure formatting / data helpers shared across the UI. */

export const formatRuntime = (minutes) => {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

export const formatMoney = (value) => {
  if (!value) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  return `$${value.toLocaleString()}`;
};

export const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

export const unique = (list) => Array.from(new Set(list));

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** Deterministic pseudo-random 0..1 from any integer — keeps SSR and client in sync. */
export const seeded = (seed) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

export function debounce(fn, delay = 300) {
  let timer;
  const wrapped = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  wrapped.cancel = () => clearTimeout(timer);
  return wrapped;
}

export const normalizeText = (str = "") =>
  String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const matchesQuery = (movie, query) => {
  if (!query || !query.trim() || !movie) return true;
  const q = query.trim().toLowerCase();
  const normQ = normalizeText(q);
  const compactQ = normQ.replace(/\s+/g, "");

  // 1. Direct title check
  const normTitle = normalizeText(movie.title);
  const compactTitle = normTitle.replace(/\s+/g, "");
  if (normTitle.includes(normQ) || compactTitle.includes(compactQ)) {
    return true;
  }

  // 2. Full movie searchable content
  const cast = Array.isArray(movie.cast) ? movie.cast : [];
  const genres = Array.isArray(movie.genres) ? movie.genres : [];
  const writers = Array.isArray(movie.writers) ? movie.writers : [];
  const full = [
    movie.title,
    movie.director,
    ...cast,
    ...genres,
    ...writers,
    String(movie.year || ""),
    movie.language || "",
    movie.tagline || "",
    movie.overview || "",
  ]
    .filter(Boolean)
    .join(" ");

  const normFull = normalizeText(full);
  const compactFull = normFull.replace(/\s+/g, "");

  if (normFull.includes(normQ) || compactFull.includes(compactQ)) {
    return true;
  }

  // 3. Multi-word tokens matching (all words in query must exist in movie details)
  const tokens = normQ.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((token) => normFull.includes(token))) {
    return true;
  }

  return false;
};
