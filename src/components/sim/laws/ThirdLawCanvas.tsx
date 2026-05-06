import { useEffect, useRef, useState } from "react";
import type { LawSample } from "./types";

type Props = {
  thrust: number;
  massA: number;
  massB: number;
  showVectors: boolean;
  running: boolean;
  launchTrigger: number;
  resetTrigger: number;
  onSamples: (s: LawSample[]) => void;
  onLive: (data: { thrust: number; reaction: number; momentum: number; vA: number; vB: number }) => void;
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number };

export function ThirdLawCanvas({
  thrust, massA, massB, showVectors, running, launchTrigger, resetTrigger, onSamples, onLive,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 460 });

  const stateRef = useRef({
    cx: 0, xA: 0, xB: 0, vA: 0, vB: 0, t: 0, launched: false,
    samples: [] as LawSample[], particles: [] as Particle[], stars: [] as any[],
  });
  const propsRef = useRef({ thrust, massA, massB, showVectors });
  propsRef.current = { thrust, massA, massB, showVectors };

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
    const cx = size.w / 2;
    stateRef.current = {
      cx, xA: cx - 60, xB: cx + 60, vA: 0, vB: 0, t: 0, launched: false,
      samples: [], particles: [],
      stars: Array.from({ length: 60 }, () => ({
        x: Math.random() * size.w, y: Math.random() * size.h * 0.7,
        r: Math.random() * 1.4 + 0.3, a: Math.random() * 0.7 + 0.2,
      })),
    };
    onSamples([]);
  }, [resetTrigger, size.w, size.h, onSamples]);

  useEffect(() => {
    const st = stateRef.current;
    const p = propsRef.current;
    if (!st.launched) {
      const impulse = p.thrust * 0.4;
      st.vA = -impulse / p.massA;
      st.vB = impulse / p.massB;
      st.launched = true;
    }
  }, [launchTrigger]);

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

      if (running && st.launched) {
        st.t += dt;
        st.xA += st.vA * dt * 30;
        st.xB += st.vB * dt * 30;
        st.vA *= 0.995; st.vB *= 0.995;

        for (let i = 0; i < 3; i++) {
          st.particles.push({
            x: (st.xA + st.xB) / 2 + (Math.random() - 0.5) * 20,
            y: ground - 40 + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 60,
            vy: (Math.random() - 0.5) * 60 - 20,
            life: 0.6,
          });
        }

        st.samples.push({ t: st.t, v: st.vB, a: 0, x: st.xB - st.cx, f: p.thrust });
        if (st.samples.length > 200) st.samples.shift();
        if (st.samples.length % 4 === 0) onSamples([...st.samples]);

        liveAcc += dt;
        if (liveAcc > 0.1) {
          liveAcc = 0;
          onLive({
            thrust: p.thrust, reaction: p.thrust,
            momentum: Math.abs(p.massB * st.vB),
            vA: st.vA, vB: st.vB,
          });
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

      const groundGrad = ctx.createLinearGradient(0, ground, 0, size.h);
      groundGrad.addColorStop(0, "#3d2469"); groundGrad.addColorStop(1, "#1a0d2e");
      ctx.fillStyle = groundGrad; ctx.fillRect(0, ground, size.w, size.h - ground);
      ctx.strokeStyle = "rgba(180,120,255,0.5)";
      ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(size.w, ground); ctx.stroke();

      st.particles = st.particles.filter((pt) => pt.life > 0);
      st.particles.forEach((pt) => {
        pt.life -= dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 100 * dt;
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = "#ff8c42";
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      drawSkater(ctx, st.xA, ground, p.massA, "#7dd3fc", "A");
      drawSkater(ctx, st.xB, ground, p.massB, "#f0abfc", "B");

      if (showVectorsFromProps()) {
        const mid = (st.xA + st.xB) / 2;
        drawVector(ctx, st.xA + 24, ground - 50, -p.thrust * 4, 0, "#7dd3fc", `−F (${p.thrust}N)`);
        drawVector(ctx, st.xB - 24, ground - 50, p.thrust * 4, 0, "#f0abfc", `+F (${p.thrust}N)`);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "10px monospace"; ctx.textAlign = "center";
        ctx.fillText("F_AB = −F_BA", mid, ground - 80);
        ctx.textAlign = "start";
      }

      raf = requestAnimationFrame(tick);
    };

    function showVectorsFromProps() { return propsRef.current.showVectors; }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size.w, size.h, running, onSamples, onLive]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas ref={canvasRef} width={size.w} height={size.h} className="w-full rounded-3xl" style={{ height: size.h }} />
    </div>
  );
}

function drawSkater(ctx: CanvasRenderingContext2D, x: number, ground: number, mass: number, color: string, label: string) {
  const r = 14 + mass * 1.5;
  ctx.save();
  ctx.shadowColor = color; ctx.shadowBlur = 18;
  const g = ctx.createRadialGradient(x, ground - r - 10, 2, x, ground - r - 10, r);
  g.addColorStop(0, "#fff"); g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, ground - r - 10, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, ground - 10); ctx.lineTo(x - 8, ground - 2);
  ctx.moveTo(x, ground - 10); ctx.lineTo(x + 8, ground - 2);
  ctx.stroke();
  ctx.fillStyle = "#1a0d2e"; ctx.font = "bold 14px monospace"; ctx.textAlign = "center";
  ctx.fillText(label, x, ground - r - 6);
  ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "10px monospace";
  ctx.fillText(`${mass}kg`, x, ground + 10);
  ctx.textAlign = "start";
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
  ctx.fillText(label, dx > 0 ? x + dx + 6 : x + dx - 70, y + dy - 4);
  ctx.restore();
}
