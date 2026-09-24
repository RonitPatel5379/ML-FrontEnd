/**
 * CineVerse Hub - Centralized API Configuration
 * Connects frontend with the Python FastAPI ML recommendation service
 */

export const API_CONFIG = {
  // Live Render backend URL with local fallback
  backendUrl: import.meta.env.VITE_API_BASE_URL || "https://ml-backend-8unk.onrender.com",

  // Production Vercel deployment URL
  frontendUrl: "https://movierecobox.vercel.app",

  // Backend API endpoints
  endpoints: {
    root: "/",
    health: "/health",
    predict: "/predict",
    search: "/search",
    movies: "/movies",
    movieById: (id) => `/movies/${encodeURIComponent(id)}`,
    genres: "/genres",
    trending: "/trending",
    welcome: (name) => `/welcome/${encodeURIComponent(name)}`,
  },

  // Request timeout in milliseconds
  timeoutMs: 8000,
};

export default API_CONFIG;
