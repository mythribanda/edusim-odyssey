import { motion } from "framer-motion";
import { Play, RotateCcw, Repeat, Lightbulb } from "lucide-react";
import { GRAVITIES, type GravityKey } from "@/physics/projectile";

type Props = {
  power: number;
  angle: number;
  gravityKey: GravityKey;
  setGravityKey: (k: GravityKey) => void;
  onLaunch: () => void;
  onReset: () => void;
  onReplay: () => void;
  onExplain: () => void;
  canLaunch: boolean;
};

export function Controls({
  power,
  angle,
  gravityKey,
  setGravityKey,
  onLaunch,
  onReset,
  onReplay,
  onExplain,
  canLaunch,
}: Props) {
  const g = GRAVITIES[gravityKey];
  return (
    <div className="glass-strong rounded-3xl p-5 space-y-5 h-full">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Launch Parameters
        </h3>
        <div className="space-y-3">
          <Readout label="Power" value={power.toFixed(1)} unit="m/s" color="var(--neon-purple)" />
          <Readout label="Angle θ" value={angle.toFixed(1)} unit="°" color="var(--neon-cyan)" />
          <Readout label="Gravity" value={g.toFixed(1)} unit="m/s²" color="var(--neon-blue)" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Planet
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(GRAVITIES) as GravityKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setGravityKey(k)}
              className={`px-2 py-2 rounded-xl text-xs font-medium transition-all ${
                gravityKey === k
                  ? "bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] text-white glow-purple"
                  : "glass hover:neon-border"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={!canLaunch}
          onClick={onLaunch}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white font-medium disabled:opacity-40 hover:glow-purple"
        >
          <Play className="w-4 h-4" /> Launch
        </motion.button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-2xl glass text-sm hover:neon-border"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={onReplay}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-2xl glass text-sm hover:neon-border"
          >
            <Repeat className="w-3.5 h-3.5" /> Replay
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Equations
        </h3>
        <Eq label="Range" formula="R = v² sin(2θ) / g" />
        <Eq label="Max Height" formula="H = v² sin²(θ) / 2g" />
        <Eq label="Time of Flight" formula="T = 2v sin(θ) / g" />
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

function Readout({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="glass rounded-2xl px-3 py-2 flex items-baseline justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold" style={{ color, textShadow: `0 0 10px ${color}` }}>
        {value} <span className="text-[10px] text-muted-foreground">{unit}</span>
      </span>
    </div>
  );
}

function Eq({ label, formula }: { label: string; formula: string }) {
  return (
    <div className="glass rounded-xl px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-xs text-[var(--neon-cyan)]">{formula}</div>
    </div>
  );
}
