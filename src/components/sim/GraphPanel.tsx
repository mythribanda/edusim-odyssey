type Sample = { t: number; vx: number; vy: number; h: number };

export function GraphPanel({ samples, T }: { samples: Sample[]; T: number }) {
  const graphs = [
    { title: "Vx vs t", color: "var(--neon-cyan)", get: (s: Sample) => s.vx, unit: "m/s" },
    { title: "Vy vs t", color: "var(--neon-purple)", get: (s: Sample) => s.vy, unit: "m/s" },
    { title: "Height vs t", color: "var(--neon-blue)", get: (s: Sample) => s.h, unit: "m" },
  ];
  return (
    <div className="glass-strong rounded-3xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
      {graphs.map((g) => (
        <Graph key={g.title} title={g.title} color={g.color} unit={g.unit}
          samples={samples} get={g.get} T={Math.max(T, 0.01)} />
      ))}
    </div>
  );
}

function Graph({
  title, color, unit, samples, get, T,
}: {
  title: string; color: string; unit: string;
  samples: Sample[]; get: (s: Sample) => number; T: number;
}) {
  const W = 220, H = 90, PAD = 6;
  const ys = samples.map(get);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(1, ...ys.map((v) => Math.abs(v)), ...ys);
  const span = maxY - minY || 1;
  const path = samples
    .map((s, i) => {
      const x = PAD + (s.t / T) * (W - PAD * 2);
      const y = H - PAD - ((get(s) - minY) / span) * (H - PAD * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = samples[samples.length - 1];
  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-xs font-semibold">{title}</div>
        <div className="font-mono text-xs" style={{ color }}>
          {last ? `${get(last).toFixed(1)} ${unit}` : "—"}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[90px]">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="white" strokeOpacity="0.1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="white" strokeOpacity="0.1" />
        {path && (
          <path d={path} fill="none" stroke={color} strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        )}
      </svg>
    </div>
  );
}
