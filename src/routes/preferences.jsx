import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import PageHeader from "../components/PageHeader";
import { GENRE_NAMES, LANGUAGES } from "../data/genres";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";

export const Route = createFileRoute("/preferences")({
  head: () => ({
    meta: [
      { title: "Recommendation Preferences — CineVerse" },
      {
        name: "description",
        content:
          "Tell CineVerse which genres, languages, ratings and release periods you love to sharpen your recommendations.",
      },
      { property: "og:title", content: "Recommendation Preferences — CineVerse" },
      {
        property: "og:description",
        content: "Tune the recommendation engine to your exact taste.",
      },
    ],
  }),
  component: Preferences,
});

const PERIODS = [
  { value: "any", label: "Any era" },
  { value: "2020", label: "2020s" },
  { value: "2010", label: "2010 and newer" },
  { value: "2000", label: "2000 and newer" },
];

function Preferences() {
  const { user, updateProfile } = useAuth();
  const { preferences, savePreferences, hydrated } = useUser();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => ({
    ...preferences,
    displayName: preferences.displayName || user?.name || "",
    email: preferences.email || user?.email || "",
  }));

  useEffect(() => {
    if (hydrated) {
      setDraft((current) => ({
        ...preferences,
        displayName: preferences.displayName || user?.name || current.displayName || "",
        email: preferences.email || user?.email || current.email || "",
      }));
    }
  }, [hydrated, preferences, user?.name, user?.email]);

  const toggleIn = (key, value) =>
    setDraft((current) => {
      const list = current[key] || [];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      };
    });

  const submit = async (event) => {
    event.preventDefault();
    savePreferences(draft);
    if (draft.displayName && draft.displayName !== user?.name && updateProfile) {
      await updateProfile({ name: draft.displayName });
    }
    navigate({ to: "/profile" });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Onboarding"
        title="What kind of movies do you love?"
        description="Pick as many as you like — the recommendation engine weights genre match at 40% of every score."
      />

      <form onSubmit={submit} className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-8">
        <fieldset className="glass card-elevated rounded-3xl p-6">
          <legend className="px-2 font-display text-lg font-semibold">Favorite genres</legend>
          <div className="mt-4 flex flex-wrap gap-2">
            {GENRE_NAMES.map((genre) => {
              const active = (draft.genres || []).includes(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleIn("genres", genre)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? "btn-primary" : "btn-glass text-muted-foreground"
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  {genre}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="glass card-elevated rounded-3xl p-6">
          <legend className="px-2 font-display text-lg font-semibold">Favorite languages</legend>
          <div className="mt-4 flex flex-wrap gap-2">
            {LANGUAGES.map((language) => {
              const active = (draft.languages || []).includes(language);
              return (
                <button
                  key={language}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleIn("languages", language)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    active ? "btn-primary" : "btn-glass text-muted-foreground"
                  }`}
                >
                  {language}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="glass card-elevated rounded-3xl p-6">
            <h2 className="font-display text-lg font-semibold">
              Minimum rating · {Number(draft.minRating).toFixed(1)}
            </h2>
            <input
              type="range"
              min="0"
              max="9"
              step="0.5"
              value={draft.minRating}
              onChange={(event) => setDraft({ ...draft, minRating: Number(event.target.value) })}
              className="mt-6 w-full accent-[var(--primary)]"
              aria-label="Minimum rating"
            />
          </div>

          <div className="glass card-elevated rounded-3xl p-6">
            <h2 className="font-display text-lg font-semibold">Preferred release period</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {PERIODS.map((period) => (
                <button
                  key={period.value}
                  type="button"
                  aria-pressed={draft.period === period.value}
                  onClick={() => setDraft({ ...draft, period: period.value })}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    draft.period === period.value ? "btn-primary" : "btn-glass text-muted-foreground"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass card-elevated grid gap-4 rounded-3xl p-6 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted-foreground">Display name</span>
            <input
              value={draft.displayName || ""}
              onChange={(event) => setDraft({ ...draft, displayName: event.target.value })}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              value={draft.email || ""}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>

        <button type="submit" className="btn-primary w-full rounded-full py-4 text-sm font-semibold">
          Save preferences
        </button>
      </form>
    </div>
  );
}
