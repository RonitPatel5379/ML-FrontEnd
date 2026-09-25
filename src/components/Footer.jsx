import { Link } from "@tanstack/react-router";
import { Clapperboard, Github, Instagram, Twitter, Youtube } from "lucide-react";

const COLUMNS = [
  {
    title: "Browse",
    links: [
      { label: "Discover", to: "/discover" },
      { label: "Genres", to: "/genres" },
      { label: "Trending", to: "/trending" },
    ],
  },
  {
    title: "Your space",
    links: [
      { label: "Watchlist", to: "/watchlist" },
      { label: "Favorites", to: "/favorites" },
      { label: "Preferences", to: "/preferences" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Profile", to: "/profile" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
    ],
  },
];

const SOCIALS = [
  { Icon: Twitter, label: "Twitter", href: "https://twitter.com" },
  { Icon: Instagram, label: "Instagram", href: "https://instagram.com" },
  { Icon: Youtube, label: "YouTube", href: "https://youtube.com" },
  { Icon: Github, label: "GitHub", href: "https://github.com" }
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <Clapperboard className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="gradient-text font-display text-xl font-black">CineVerse</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            CineVerse is a cinematic discovery platform that learns what you love and turns it into
            recommendations worth your evening.
          </p>
          <div className="mt-6 flex gap-2">
            {SOCIALS.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="btn-glass grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-all hover:text-foreground hover:scale-110"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h3 className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              {column.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground sm:px-8">
        © 2026 CineVerse. All rights reserved.
      </div>
    </footer>
  );
}
