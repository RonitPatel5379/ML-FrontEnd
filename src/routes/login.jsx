import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clapperboard, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { ensureLiveApiConnected } from "../services/mlApi";
import backdrop from "../assets/backdrop-neon.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — CineVerse" },
      {
        name: "description",
        content: "Sign in to CineVerse to sync your watchlist, favorites and taste profile.",
      },
      { property: "og:title", content: "Sign in — CineVerse" },
      { property: "og:description", content: "Access your CineVerse account." },
    ],
  }),
  component: Login,
});

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-10 py-3 text-sm outline-none focus:border-primary";

function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Proactively pre-warm live ML backend container while user is on login page
    void ensureLiveApiConnected();
  }, []);

  // If already signed in, immediately redirect to Home
  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: "/", replace: true });
    }
  }, [isAuthenticated, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.email.includes("@") || form.password.length < 4) {
      toast.error("Enter a valid email and a password of 4+ characters.");
      return;
    }
    setBusy(true);
    try {
      await login({ email: form.email, password: form.password, remember: form.remember });
      await navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(error.message || "Could not sign you in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start px-4 pt-8 pb-12">
      <img
        src={backdrop}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="hero-scrim absolute inset-0" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass card-elevated relative w-full max-w-md rounded-3xl p-8"
      >
        <div className="mb-8 text-center">
          <span
            className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Clapperboard className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold">Welcome back to CineVerse</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your recommendations and movie hub.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="relative block">
            <span className="mb-1.5 block text-xs text-muted-foreground">Email</span>
            <Mail
              className="absolute top-9 left-3 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@cineverse.app"
              className={inputClass}
            />
          </label>

          <label className="relative block">
            <span className="mb-1.5 block text-xs text-muted-foreground">Password</span>
            <Lock
              className="absolute top-9 left-3 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="••••••••"
              className={inputClass}
            />
          </label>

          <div className="flex items-center justify-between text-xs">
            <label className="inline-flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(event) => setForm({ ...form, remember: event.target.checked })}
                className="accent-[var(--primary)]"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full rounded-full py-3 text-sm font-semibold disabled:opacity-70"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>

        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          New to CineVerse?{" "}
          <Link to="/register" className="font-semibold text-primary-glow hover:underline">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
