import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Clapperboard, LogOut, Menu, Search, Settings, User, X } from "lucide-react";

import SearchOverlay from "./SearchOverlay";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../context/UserContext";
import { initials } from "../utils/helpers";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Discover" },
  { to: "/genres", label: "Genres" },
  { to: "/trending", label: "Trending" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/favorites", label: "Favorites" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { watchlist } = useUser();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-strong py-2 shadow-lg" : "bg-transparent py-4"
        }`}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-8"
        >
          <Link to="/" className="flex items-center gap-2" aria-label="CineVerse home">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <Clapperboard className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="leading-none">
              <span className="gradient-text font-display text-xl font-black tracking-tight">
                CineVerse
              </span>
              <span className="hidden text-[10px] tracking-[0.2em] text-muted-foreground uppercase sm:block">
                Discover your next favorite movie
              </span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  activeOptions={{ exact: link.to === "/" }}
                  activeProps={{ className: "text-foreground bg-surface-2" }}
                  inactiveProps={{ className: "text-muted-foreground" }}
                  className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:text-foreground"
                >
                  {link.label}
                  {link.to === "/watchlist" && watchlist.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {watchlist.length}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="btn-glass grid h-10 w-10 place-items-center rounded-full"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="btn-glass relative hidden h-10 w-10 place-items-center rounded-full sm:grid"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Account menu"
                className="grid h-10 w-10 place-items-center rounded-full text-xs font-bold text-primary-foreground"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                {isAuthenticated ? initials(user?.name) || "CV" : <User className="h-4 w-4" aria-hidden="true" />}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    role="menu"
                    className="glass card-elevated absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl p-2"
                  >
                    {isAuthenticated ? (
                      <>
                        <div className="px-3 py-2">
                          <p className="truncate text-sm font-semibold capitalize">{user?.name || "Cinephile"}</p>
                          <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
                        >
                          <User className="h-4 w-4" aria-hidden="true" /> Profile
                        </Link>
                        <Link
                          to="/preferences"
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
                        >
                          <Settings className="h-4 w-4" aria-hidden="true" /> Preferences
                        </Link>
                        <button
                          type="button"
                          onClick={logout}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-surface-2"
                        >
                          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
                        >
                          Sign in
                        </Link>
                        <Link
                          to="/register"
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
                        >
                          Create account
                        </Link>
                        <Link
                          to="/preferences"
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
                        >
                          <Settings className="h-4 w-4" aria-hidden="true" /> Preferences
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="btn-glass grid h-10 w-10 place-items-center rounded-full lg:hidden"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-strong mt-2 overflow-hidden px-4 lg:hidden"
            >
              {LINKS.concat([{ to: "/profile", label: "Profile" }]).map((link) => (
                <li key={link.to} className="border-b border-border last:border-0">
                  <Link
                    to={link.to}
                    activeOptions={{ exact: link.to === "/" }}
                    activeProps={{ className: "text-primary-glow" }}
                    className="block py-3 text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
