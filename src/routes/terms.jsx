import { createFileRoute } from "@tanstack/react-router";

import PageHeader from "../components/PageHeader";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — CineVerse" },
      {
        name: "description",
        content: "The terms that apply when you browse and use the CineVerse discovery platform.",
      },
      { property: "og:title", content: "Terms of Service — CineVerse" },
      { property: "og:description", content: "Using CineVerse: what you can expect from us." },
    ],
  }),
  component: Terms,
});

const SECTIONS = [
  {
    title: "Using CineVerse",
    body: "CineVerse is a movie discovery experience. Catalog data is provided for informational purposes and we make no guarantee of availability on any streaming service.",
  },
  {
    title: "Your content",
    body: "Reviews you publish stay on your device in this build. Keep them civil — the feature is designed for genuine opinions about movies.",
  },
  {
    title: "Changes",
    body: "We may update these terms as the product evolves. Continued use after an update means you accept the revised terms.",
  },
];

function Terms() {
  return (
    <div>
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description="The ground rules for using CineVerse."
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
