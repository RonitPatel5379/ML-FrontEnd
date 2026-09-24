import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "./AuthContext";
import { STORAGE_KEYS, readStorage, writeStorage } from "../utils/localStorage";

const UserContext = createContext(null);

export const DEFAULT_PREFERENCES = {
  genres: [],
  languages: [],
  minRating: 0,
  period: "any",
  displayName: "",
  email: "",
};

function getUserStorageKey(baseKey, userId) {
  return userId ? `${baseKey}:${userId}` : `${baseKey}:guest`;
}

export function UserProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const userKey = userId ? `user:${userId}` : "guest";
  const loadedKeyRef = useRef(null);

  const [hydrated, setHydrated] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recent, setRecent] = useState([]);
  const [watched, setWatched] = useState([]);
  const [reviews, setReviews] = useState({});
  const [searches, setSearches] = useState([]);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  // Hydrate from LocalStorage scoped to the active user
  useEffect(() => {
    const key = (base) => getUserStorageKey(base, userId);
    setWatchlist(readStorage(key(STORAGE_KEYS.watchlist), []));
    setFavorites(readStorage(key(STORAGE_KEYS.favorites), []));

    const storedRecent = readStorage(key(STORAGE_KEYS.recent), { items: [], watched: [] });
    const storedWatched = Array.isArray(storedRecent.watched) ? storedRecent.watched : [];
    // Ensure fully watched titles or titles with progress >= 100 are excluded from recent items
    const activeItems = (storedRecent.items || []).filter(
      (entry) => (entry.progress ?? 0) < 100 && !storedWatched.includes(entry.id),
    );

    setRecent(activeItems);
    setWatched(storedWatched);
    setReviews(readStorage(key(STORAGE_KEYS.reviews), {}));
    setSearches(readStorage(key(STORAGE_KEYS.searches), []));
    const storedPrefs = readStorage(key(STORAGE_KEYS.preferences), {});
    setPreferences({
      ...DEFAULT_PREFERENCES,
      displayName: user?.name || "",
      email: user?.email || "",
      ...storedPrefs,
    });
    loadedKeyRef.current = userKey;
    setHydrated(true);
  }, [userKey, userId, user?.name, user?.email]);

  useEffect(() => {
    if (hydrated && loadedKeyRef.current === userKey) {
      writeStorage(getUserStorageKey(STORAGE_KEYS.watchlist, userId), watchlist);
    }
  }, [watchlist, hydrated, userKey, userId]);

  useEffect(() => {
    if (hydrated && loadedKeyRef.current === userKey) {
      writeStorage(getUserStorageKey(STORAGE_KEYS.favorites, userId), favorites);
    }
  }, [favorites, hydrated, userKey, userId]);

  useEffect(() => {
    if (hydrated && loadedKeyRef.current === userKey) {
      writeStorage(getUserStorageKey(STORAGE_KEYS.recent, userId), { items: recent, watched });
    }
  }, [recent, watched, hydrated, userKey, userId]);

  useEffect(() => {
    if (hydrated && loadedKeyRef.current === userKey) {
      writeStorage(getUserStorageKey(STORAGE_KEYS.reviews, userId), reviews);
    }
  }, [reviews, hydrated, userKey, userId]);

  useEffect(() => {
    if (hydrated && loadedKeyRef.current === userKey) {
      writeStorage(getUserStorageKey(STORAGE_KEYS.searches, userId), searches);
    }
  }, [searches, hydrated, userKey, userId]);

  useEffect(() => {
    if (hydrated && loadedKeyRef.current === userKey) {
      writeStorage(getUserStorageKey(STORAGE_KEYS.preferences, userId), preferences);
    }
  }, [preferences, hydrated, userKey, userId]);

  const inWatchlist = useCallback((id) => watchlist.includes(id), [watchlist]);
  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);
  const isWatched = useCallback((id) => watched.includes(id), [watched]);

  const toggleWatchlist = useCallback((movie) => {
    setWatchlist((current) => {
      const exists = current.includes(movie.id);
      toast[exists ? "message" : "success"](
        exists ? "Removed from Watchlist" : "Added to Watchlist ✓",
        { description: movie.title },
      );
      return exists ? current.filter((id) => id !== movie.id) : [movie.id, ...current];
    });
  }, []);

  const toggleFavorite = useCallback((movie) => {
    setFavorites((current) => {
      const exists = current.includes(movie.id);
      toast[exists ? "message" : "success"](
        exists ? "Removed from Favorites" : "Added to Favorites ❤️",
        { description: movie.title },
      );
      return exists ? current.filter((id) => id !== movie.id) : [movie.id, ...current];
    });
  }, []);

  /**
   * Marks a full movie as watched.
   * Only when full movie is watched is it removed from Continue Watching.
   * If un-marked (user did not watch full movie), it is restored to Continue Watching.
   */
  const markWatched = useCallback((movie) => {
    setWatched((current) => {
      const exists = current.includes(movie.id);
      if (exists) {
        toast.message("Removed from Profile Watched", { description: movie.title });
        // Since the user did NOT watch the full movie, restore to Continue Watching
        setRecent((recentCurrent) => {
          const already = recentCurrent.some((entry) => entry.id === movie.id);
          if (already) return recentCurrent;
          return [
            { id: movie.id, progress: 45, viewedAt: new Date().toISOString() },
            ...recentCurrent,
          ];
        });
        return current.filter((id) => id !== movie.id);
      } else {
        toast.success("Added to Watched in Profile", {
          description: `${movie.title} added to your profile's watched movies.`,
        });
        // User watched the full movie: remove from Continue Watching
        setRecent((recentCurrent) => recentCurrent.filter((entry) => entry.id !== movie.id));
        return [movie.id, ...current];
      }
    });
  }, []);

  /**
   * Unfinished movies must not be removed from Continue Watching.
   */
  const removeFromRecent = useCallback((movieId) => {
    setWatched((watchedCurrent) => {
      // Only remove if full movie was already completed
      if (watchedCurrent.includes(movieId)) {
        setRecent((current) => current.filter((entry) => entry.id !== movieId));
      } else {
        toast.info("Movie kept in Continue Watching", {
          description: "Unfinished movies stay in Continue Watching until full movie is watched.",
        });
      }
      return watchedCurrent;
    });
  }, []);

  /** Update playback progress; automatically completes movie if progress >= 100 */
  const updateProgress = useCallback((movie, progress) => {
    const numericProgress = Math.min(100, Math.max(0, Math.round(progress)));
    if (numericProgress >= 100) {
      setWatched((current) => (current.includes(movie.id) ? current : [movie.id, ...current]));
      setRecent((current) => current.filter((entry) => entry.id !== movie.id));
      toast.success("Added to Watched in Profile", {
        description: `${movie.title} completed and added to your profile.`,
      });
    } else {
      // User did not finish full movie: keep in Continue Watching!
      setWatched((current) => current.filter((id) => id !== movie.id));
      setRecent((current) => {
        const next = [
          { id: movie.id, progress: numericProgress, viewedAt: new Date().toISOString() },
          ...current.filter((entry) => entry.id !== movie.id),
        ];
        return next;
      });
      toast.info(`Watching progress: ${numericProgress}%`, {
        description: "Movie stays in Continue Watching until full movie is watched.",
      });
    }
  }, []);

  /**
   * Called when a movie is viewed.
   * If already marked as full movie watched, do not re-add to Continue Watching.
   * If in progress, preserve progress and keep in Continue Watching.
   */
  const trackView = useCallback((movie) => {
    setWatched((watchedCurrent) => {
      if (watchedCurrent.includes(movie.id)) {
        return watchedCurrent;
      }

      setRecent((current) => {
        const existing = current.find((entry) => entry.id === movie.id);
        const progress = existing
          ? existing.progress
          : Math.floor(15 + ((movie.id * 17) % 45));
        const next = [
          { id: movie.id, progress, viewedAt: new Date().toISOString() },
          ...current.filter((entry) => entry.id !== movie.id),
        ];
        // Do not slice out unwatched in-progress movies so they are not lost!
        return next;
      });

      return watchedCurrent;
    });
  }, []);

  const recordSearch = useCallback((term) => {
    const clean = term.trim();
    if (clean.length < 2) return;
    setSearches((current) => [clean, ...current.filter((t) => t !== clean)].slice(0, 8));
  }, []);

  const addReview = useCallback((movieId, review) => {
    setReviews((current) => ({
      ...current,
      [movieId]: [{ ...review, id: Date.now() }, ...(current[movieId] || [])],
    }));
    toast.success("Review published ✓");
  }, []);

  const savePreferences = useCallback((next) => {
    setPreferences((current) => ({ ...current, ...next }));
    toast.success("Preferences saved", { description: "Your recommendations just got smarter." });
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      watchlist,
      favorites,
      recent,
      watched,
      reviews,
      searches,
      preferences,
      inWatchlist,
      isFavorite,
      isWatched,
      toggleWatchlist,
      toggleFavorite,
      markWatched,
      removeFromRecent,
      updateProgress,
      trackView,
      recordSearch,
      addReview,
      savePreferences,
    }),
    [
      hydrated,
      watchlist,
      favorites,
      recent,
      watched,
      reviews,
      searches,
      preferences,
      inWatchlist,
      isFavorite,
      isWatched,
      toggleWatchlist,
      toggleFavorite,
      markWatched,
      removeFromRecent,
      updateProgress,
      trackView,
      recordSearch,
      addReview,
      savePreferences,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside <UserProvider>");
  return context;
}
