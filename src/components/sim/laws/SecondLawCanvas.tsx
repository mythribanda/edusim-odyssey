import { useEffect, useRef, useState } from "react";
import type { LawSample } from "./types";

type Props = {
  force: number;
  mass: number;
  showVectors: boolean;
  running: boolean;
  resetTrigger: number;
  onSamples: (s: LawSample[]) => void;
  onLive: (data: { force: number; mass: number; accel: number; velocity: number; displacement: number }) => void;
};

export function SecondLawCanvas({
  force, mass, showVectors, running, resetTrigger, onSamples, onLive,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 460 });

  const stateRef = useRef({
    x: 80, v: 0, t: 0, samples: [] as LawSample[], trail: [] as { x: number; y: number }[], stars: [] as any[],
  });
  const propsRef = useRef({ force, mass, showVectors });
  propsRef.current = { force, mass, showVectors };

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
        setSize({ w, h: Math.max(360, Math.min(540, w * 0.55)) });
      }
    });
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    stateRef.current = {
      x: 80, v: 0, t: 0, samples: [], trail: [],
      stars: Array.from({ length: 60 }, () => ({
        x: Math.random() * size.w, y: Math.random() * size.h * 0.7,
        r: Math.random() * 1.4 + 0.3, a: Math.random() * 0.7 + 0.2,
      })),
    };
    onSamples([]);
  }, [resetTrigger, size.w, size.h, onSamples]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0, prev = performance.now(), liveAcc = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - prev) / 1000);
      prev = now;
      const st = stateRef.current;
      const p = propsRef.current;
      const ground = size.h - 60;
      const a = p.force / Math.max(0.1, p.mass);

      if (running) {
        st.t += dt;
        st.v += a * dt;
        st.x += st.v * dt * 8;
        if (st.x > size.w - 80) { st.x = 80; st.v = 0; st.trail = []; }
        st.trail.push({ x: st.x, y: ground - 40 });
        if (st.trail.length > 40) st.trail.shift();

        st.samples.push({ t: st.t, v: st.v, a, x: (st.x - 80) / 8, f: p.force });
        if (st.samples.length > 200) st.samples.shift();
        if (st.samples.length % 4 === 0) onSamples([...st.samples]);

        liveAcc += dt;
        if (liveAcc > 0.1) {
          liveAcc = 0;
          onLive({ force: p.force, mass: p.mass, accel: a, velocity: st.v, displacement: (st.x - 80) / 8 });
        }
      }

      ctx.clearRect(0, 0, size.w, size.h);
      const grad = ctx.createLinearGradient(0, 0, 0, size.h);
      grad.addColorStop(0, "#0b0a1f"); grad.addColorStop(0.6, "#15102e"); grad.addColorStop(1, "#1a0d2e");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, size.w, size.h);

      ctx.fillStyle = "white";
      st.stars.forEach((s) => {
        ctx.globalAlpha = s.a * (0.6 + 0.4 * Math.sin(now / 800 + s.x));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.strokeStyle = "rgba(180,120,255,0.4)"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(size.w, ground); ctx.stroke();
      ctx.strokeStyle = "rgba(125,211,252,0.2)"; ctx.lineWidth = 1;
      for (let i = 0; i < size.w; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, ground); ctx.lineTo(i, ground + 12); ctx.stroke();
      }

      if (st.trail.length) {
        ctx.strokeStyle = "rgba(180,120,255,0.5)"; ctx.lineWidth = 2;
        ctx.beginPath();
        st.trail.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
        ctx.stroke();
      }

      const blockSize = 30 + p.mass * 4;
      const bx = st.x - blockSize / 2, by = ground - blockSize;
      ctx.save();
      ctx.shadowColor = "#7c5fff"; ctx.shadowBlur = 22;
      const bg = ctx.createLinearGradient(bx, by, bx, by + blockSize);
      bg.addColorStop(0, "#a78bfa"); bg.addColorStop(1, "#3a2470");
      ctx.fillStyle = bg;
      roundRect(ctx, bx, by, blockSize, blockSize, 6); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#fff"; ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${p.mass}kg`, bx + blockSize / 2, by + blockSize / 2 + 4);
      ctx.textAlign = "start";

      if (p.showVectors) {
        drawVector(ctx, bx + blockSize, by + blockSize / 2, p.force * 4, 0, "#ff6ad8", `F=${p.force}N`);
        drawVector(ctx, bx + blockSize / 2, by - 12, a * 14, 0, "#7dd3fc", `a=${a.toFixed(1)}`);
        if (st.v !== 0) drawVector(ctx, bx + blockSize / 2, by - 36, st.v * 6, 0, "#fda4af", `v=${st.v.toFixed(1)}`);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size.w, size.h, running, onSamples, onLive]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas ref={canvasRef} width={size.w} height={size.h} className="w-full rounded-3xl" style={{ height: size.h }} />
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawVector(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, color: string, label: string) {
  if (Math.abs(dx) + Math.abs(dy) < 4) return;
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
  ctx.shadowColor = color; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
  const ang = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - 10 * Math.cos(ang - 0.4), y + dy - 10 * Math.sin(ang - 0.4));
  ctx.lineTo(x + dx - 10 * Math.cos(ang + 0.4), y + dy - 10 * Math.sin(ang + 0.4));
  ctx.closePath(); ctx.fill();
  ctx.font = "bold 11px monospace";
  ctx.fillText(label, x + dx + 6, y + dy - 4);
  ctx.restore();
}
