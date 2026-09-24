import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/LoadingSpinner";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Page not found — CineVerse" },
      { name: "description", content: "That page rolled off the reel. Head back to CineVerse." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotFound,
});

function NotFound() {
  const { isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      void navigate({ to: "/login", replace: true });
    }
  }, [ready, isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <LoadingSpinner label="Redirecting to sign in..." />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-32 text-center">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <p className="gradient-text font-display text-7xl font-black sm:text-9xl">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold">This scene didn&apos;t make the cut</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          The page you're looking for doesn't exist. Let's get you back to the good stuff.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary rounded-full px-6 py-3 text-sm font-semibold">
            Back home
          </Link>
          <Link to="/discover" className="btn-glass rounded-full px-6 py-3 text-sm font-semibold">
            Discover movies
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
