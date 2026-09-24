import { createFileRoute } from "@tanstack/react-router";

import PageHeader from "../components/PageHeader";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — CineVerse" },
      {
        name: "description",
        content:
          "How CineVerse handles your data: preferences, watchlist and favorites stay on your device.",
      },
      { property: "og:title", content: "Privacy Policy — CineVerse" },
      { property: "og:description", content: "Our approach to your data and privacy." },
    ],
  }),
  component: Privacy,
});

const SECTIONS = [
  {
    title: "What we store",
    body: "Your watchlist, favorites, recently watched titles, reviews and recommendation preferences are stored in your browser's LocalStorage. Nothing leaves your device.",
  },
  {
    title: "Analytics",
    body: "CineVerse does not run third-party trackers. Recommendation scoring happens entirely in your browser.",
  },
  {
    title: "Your control",
    body: "Clearing your browser storage removes every trace of your CineVerse profile immediately and permanently.",
  },
];

function Privacy() {
  return (
    <div>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="Short version: your taste profile belongs to you and stays on your device."
      />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-8">
        {SECTIONS.map((section) => (
          <section key={section.title} className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
