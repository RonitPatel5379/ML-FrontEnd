/**
 * Dynamic Trending Engine for CineVerse.
 * Ensures:
 * - 'today': Changes every day based on the calendar day.
 * - 'week': Changes every week based on the calendar ISO week.
 * - 'month': Changes every month based on the calendar month.
 */

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Returns ISO week number for a given date.
 */
export function getWeekNumber(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
}

/**
 * Provides metadata and labels for the active trending window.
 */
export function getTrendingPeriodInfo(window = "today", date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  const week = getWeekNumber(date);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (window === "today" || window === "day") {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dateFormatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return {
      key: `day-${key}`,
      badge: `Updated today · ${dateFormatted}`,
      cycleLabel: "Changes Daily",
      timeWindowLabel: "Trending Today",
      subtitle: `Today's hottest movies, refreshed daily for ${dateFormatted}`,
    };
  }

  if (window === "week") {
    const key = `${year}-W${String(week).padStart(2, "0")}`;
    return {
      key: `week-${key}`,
      badge: `Week ${week} · ${year}`,
      cycleLabel: "Changes Weekly",
      timeWindowLabel: "Trending This Week",
      subtitle: `Weekly top charts, updated every week for Week ${week} of ${year}`,
    };
  }

  const key = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthName = monthNames[month];
  return {
    key: `month-${key}`,
    badge: `${monthName} ${year}`,
    cycleLabel: "Changes Monthly",
    timeWindowLabel: "Trending This Month",
    subtitle: `Monthly chart leaders for ${monthName} ${year}, updated monthly`,
  };
}

/**
 * Computes deterministic date-based ranked trending movies.
 * Each window dynamically updates automatically when the calendar day, week, or month changes.
 */
export function getRankedTrendingMovies(movies = [], window = "today", date = new Date()) {
  if (!movies || !movies.length) return [];

  const { key } = getTrendingPeriodInfo(window, date);

  const scored = movies.map((movie) => {
    // Unique seed per movie per time-cycle
    const seed = hashString(`${key}:${movie.id}`);
    const normalizedSeed = (seed % 10000) / 10000; // 0 to 1

    let score = 0;
    if (window === "today" || window === "day") {
      // Daily: dynamic day-to-day momentum
      score = (movie.popularity * 0.45) + (movie.rating * 10 * 0.25) + (normalizedSeed * 100 * 0.30);
    } else if (window === "week") {
      // Weekly: 7-day steady trend
      score = (movie.popularity * 0.60) + (movie.rating * 10 * 0.20) + (normalizedSeed * 100 * 0.20);
    } else {
      // Monthly: 30-day blockbuster stability
      score = (movie.popularity * 0.75) + (movie.rating * 10 * 0.15) + (normalizedSeed * 100 * 0.10);
    }

    // Rank movement delta for visual chart excitement (-3 to +4)
    const momentum = (seed % 8) - 3;

    return {
      ...movie,
      trendScore: score,
      trendMomentum: momentum,
    };
  });

  return scored.sort((a, b) => b.trendScore - a.trendScore);
}
