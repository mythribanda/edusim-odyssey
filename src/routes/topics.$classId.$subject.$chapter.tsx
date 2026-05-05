import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { getClass, getSubject, getTopics } from "@/data/curriculum";
import { PageWrapper } from "@/components/Card";
import { Crumbs } from "@/components/Crumbs";
import { Play } from "lucide-react";

export const Route = createFileRoute("/topics/$classId/$subject/$chapter")({
  component: TopicsPage,
  loader: ({ params }) => {
    const c = getClass(Number(params.classId));
    const s = getSubject(Number(params.classId), params.subject);
    if (!c || !s) throw notFound();
    return { c, s, chapter: Number(params.chapter) };
  },
  notFoundComponent: () => <div className="glass rounded-3xl p-8">Not found.</div>,
  errorComponent: ({ error }) => <div className="glass rounded-3xl p-8">{error.message}</div>,
});

function TopicsPage() {
  const { c, s, chapter } = Route.useLoaderData();
  const topics = getTopics(chapter, s.name);
  return (
    <PageWrapper>
      <Crumbs
        items={[
          { label: "Home", to: "/" },
          { label: c.name, to: "/subjects/$classId", params: { classId: String(c.id) } },
          { label: s.name, to: "/chapters/$classId/$subject", params: { classId: String(c.id), subject: s.id } },
          { label: `Chapter ${chapter}` },
        ]}
      />
      <h1 className="text-3xl font-bold mb-2">Chapter {chapter} <span className="text-muted-foreground text-lg font-normal">— Topics</span></h1>
      <p className="text-muted-foreground mb-8">Pick a topic and launch its simulation.</p>
      <div className="space-y-3">
        {topics.map((t, i) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass rounded-2xl p-5 flex items-center justify-between gap-4 hover:neon-border transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--neon-purple)]/40 to-[var(--neon-cyan)]/30 flex items-center justify-center font-mono text-sm">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <h3 className="font-semibold">{t}</h3>
                <p className="text-xs text-muted-foreground">Interactive simulation included</p>
              </div>
            </div>
            <Link
              to="/simulation/$topic"
              params={{ topic: encodeURIComponent(t) }}
            >
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white text-sm font-medium hover:glow-purple transition-shadow"
              >
                <Play className="w-4 h-4" /> Simulate
              </motion.button>
            </Link>
          </motion.div>
        ))}
      </div>
    </PageWrapper>
  );
}
