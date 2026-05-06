import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Lightbulb, Eye, Zap } from "lucide-react";
import type { ReactNode } from "react";

type Slider = { label: string; value: number; min: number; max: number; step?: number; unit: string; color: string; onChange: (v: number) => void };

type Props = {
  title: string;
  sliders: Slider[];
  formulaTitle: string;
  formula: string;
  liveEquation?: string;
  showVectors: boolean;
  setShowVectors: (b: boolean) => void;
  running: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onAction?: { label: string; icon?: ReactNode; onClick: () => void };
  onExplain: () => void;
  extras?: ReactNode;
};

export function LawControls({
  title, sliders, formulaTitle, formula, liveEquation,
  showVectors, setShowVectors, running, onPlay, onPause, onReset, onAction, onExplain, extras,
}: Props) {
  return (
    <div className="glass-strong rounded-3xl p-5 space-y-5 h-full">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
          {title}
        </h3>
        <div className="space-y-3">
          {sliders.map((s) => (
            <div key={s.label} className="glass rounded-2xl px-3 py-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className="font-mono font-semibold text-sm" style={{ color: s.color, textShadow: `0 0 10px ${s.color}` }}>
                  {s.value.toFixed(s.step && s.step < 1 ? 1 : 0)} <span className="text-[10px] text-muted-foreground">{s.unit}</span>
                </span>
              </div>
              <input
                type="range" min={s.min} max={s.max} step={s.step ?? 1}
                value={s.value}
                onChange={(e) => s.onChange(Number(e.target.value))}
                className="w-full mt-1 accent-[var(--neon-purple)]"
                style={{ accentColor: s.color }}
              />
            </div>
          ))}
        </div>
      </div>

      {extras}

      <div className="space-y-2">
        {onAction && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onAction.onClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white font-medium hover:glow-purple"
          >
            {onAction.icon ?? <Zap className="w-4 h-4" />} {onAction.label}
          </motion.button>
        )}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={running ? onPause : onPlay}
            className="flex items-center justify-center gap-1 px-2 py-2 rounded-2xl glass text-xs hover:neon-border"
          >
            {running ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Play</>}
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1 px-2 py-2 rounded-2xl glass text-xs hover:neon-border"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={() => setShowVectors(!showVectors)}
            className={`flex items-center justify-center gap-1 px-2 py-2 rounded-2xl text-xs transition-all ${
              showVectors ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] neon-border" : "glass hover:neon-border"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Vectors
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {formulaTitle}
        </h3>
        <div className="glass rounded-xl px-3 py-3 text-center">
          <div className="font-mono text-lg text-[var(--neon-cyan)]" style={{ textShadow: "0 0 10px var(--neon-cyan)" }}>
            {formula}
          </div>
          {liveEquation && (
            <div className="font-mono text-xs text-muted-foreground mt-2">{liveEquation}</div>
          )}
        </div>
        <button
          onClick={onExplain}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)] text-sm hover:bg-[var(--neon-cyan)]/25 transition-colors"
        >
          <Lightbulb className="w-4 h-4" /> Explain Concept
        </button>
      </div>
    </div>
  );
}
