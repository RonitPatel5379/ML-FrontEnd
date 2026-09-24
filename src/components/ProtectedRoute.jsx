import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";

/**
 * Gates a page behind the (simulated) session. Renders an inline sign-in
 * prompt instead of redirecting, which keeps deep links shareable.
 */
export default function ProtectedRoute({ children, title = "Sign in to continue" }) {
  const { isAuthenticated, ready } = useAuth();

  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <LoadingSpinner label="Checking your session" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4">
        <div className="glass card-elevated w-full rounded-3xl p-8 text-center">
          <div
            className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Lock className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your CineVerse profile keeps your taste profile and reviews in one place.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/login" className="btn-primary rounded-full px-6 py-3 text-sm font-semibold">
              Sign in
            </Link>
            <Link to="/register" className="btn-glass rounded-full px-6 py-3 text-sm font-semibold">
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
