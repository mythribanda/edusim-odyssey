import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getSubject, getClass } from "@/data/curriculum";
import { Card, PageWrapper } from "@/components/Card";
import { Crumbs } from "@/components/Crumbs";

export const Route = createFileRoute("/chapters/$classId/$subject")({
  component: ChaptersPage,
  loader: ({ params }) => {
    const c = getClass(Number(params.classId));
    const s = getSubject(Number(params.classId), params.subject);
    if (!c || !s) throw notFound();
    return { c, s };
  },
  notFoundComponent: () => <div className="glass rounded-3xl p-8">Not found.</div>,
  errorComponent: ({ error }) => <div className="glass rounded-3xl p-8">{error.message}</div>,
});

function ChaptersPage() {
  const { c, s } = Route.useLoaderData();
  const chapters = Array.from({ length: s.chapters }, (_, i) => i + 1);
  return (
    <PageWrapper>
      <Crumbs
        items={[
          { label: "Home", to: "/" },
          { label: c.name, to: "/subjects/$classId", params: { classId: String(c.id) } },
          { label: s.name },
        ]}
      />
      <h1 className="text-3xl font-bold mb-2">{s.name} <span className="text-muted-foreground text-lg font-normal">— Chapters</span></h1>
      <p className="text-muted-foreground mb-8">{s.chapters} chapters available</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {chapters.map((n, i) => (
          <Link
            key={n}
            to="/topics/$classId/$subject/$chapter"
            params={{ classId: String(c.id), subject: s.id, chapter: String(n) }}
          >
            <Card delay={i * 0.02}>
              <div className="text-xs font-mono text-[var(--neon-cyan)] mb-2">CHAPTER</div>
              <div className="text-3xl font-bold text-gradient mb-2">{n}</div>
              <p className="text-xs text-muted-foreground">Chapter {n} of {s.chapters}</p>
            </Card>
          </Link>
        ))}
      </div>
    </PageWrapper>
  );
}
