import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  sim: "projectile" | "first" | "second" | "third";
  current: Record<string, number | string | boolean>;
  onApply: (params: Record<string, any>) => void;
  examples?: string[];
};

export function PromptBox({ sim, current, onApply, examples }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastExplain, setLastExplain] = useState<string | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("interpret-sim-prompt", {
        body: { sim, prompt, current },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const params = (data as any)?.params ?? {};
      const { explanation, ...rest } = params;
      onApply(rest);
      setLastExplain(explanation || "Applied your changes.");
      toast.success("Simulation updated");
    } catch (err: any) {
      const msg = err?.message || "Failed to interpret prompt";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-strong rounded-3xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-[var(--neon-cyan)]" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          AI Prompt — Regenerate Simulation
        </h3>
      </div>
      <form onSubmit={submit} className="flex flex-col md:flex-row gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Launch on the Moon with a steep angle and full power"
          className="flex-1 glass rounded-2xl px-4 py-3 text-sm bg-transparent outline-none focus:neon-border placeholder:text-muted-foreground/60"
        />
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          type="submit" disabled={loading || !prompt.trim()}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white text-sm font-medium disabled:opacity-40 hover:glow-purple"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Thinking…" : "Regenerate"}
        </motion.button>
      </form>
      {examples && examples.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              className="text-[11px] px-3 py-1 rounded-full glass hover:neon-border text-muted-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
      {lastExplain && (
        <div className="mt-3 text-xs text-[var(--neon-cyan)]/90 glass rounded-xl px-3 py-2">
          ✦ {lastExplain}
        </div>
      )}
    </div>
  );
}
