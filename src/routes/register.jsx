import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clapperboard } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import backdrop from "../assets/backdrop-space.jpg";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — CineVerse" },
      {
        name: "description",
        content: "Join CineVerse to build watchlists, save favorites and get personalized picks.",
      },
      { property: "og:title", content: "Create your account — CineVerse" },
      { property: "og:description", content: "Start your CineVerse taste profile in seconds." },
    ],
  }),
  component: Register,
});

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-primary";

function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  // If already signed in, immediately redirect to Home
  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: "/", replace: true });
    }
  }, [isAuthenticated, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return toast.error("Tell us your name.");
    if (!form.email.includes("@")) return toast.error("Enter a valid email address.");
    if (form.password.length < 6) return toast.error("Use at least 6 characters for your password.");
    if (form.password !== form.confirm) return toast.error("Passwords don't match.");

    setBusy(true);
    try {
      const data = await register({ name: form.name.trim(), email: form.email, password: form.password });
      if (data?.session || data?.user) {
        return navigate({ to: "/", replace: true });
      }
      return navigate({ to: "/login", replace: true });
    } catch (error) {
      toast.error(error.message || "Could not create your account.");
      return undefined;
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-28">
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
          <h1 className="font-display text-2xl font-bold">Create your CineVerse account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Discover your next favorite movie.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted-foreground">Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Ada Lovelace"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@cineverse.app"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted-foreground">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="At least 6 characters"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted-foreground">Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={(event) => setForm({ ...form, confirm: event.target.value })}
              placeholder="Repeat your password"
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full rounded-full py-3 text-sm font-semibold disabled:opacity-70"
          >
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary-glow hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
