import { useEffect, useRef, useState } from "react";
import type { LawSample } from "./types";

type Props = {
  mass: number;
  friction: number;
  velocity: number;
  showVectors: boolean;
  running: boolean;
  brakeTrigger: number;
  resetTrigger: number;
  onSamples: (s: LawSample[]) => void;
  onLive: (data: { busV: number; objV: number; netF: number; inertia: number }) => void;
};

export function FirstLawCanvas({
  mass, friction, velocity, showVectors, running,
  brakeTrigger, resetTrigger, onSamples, onLive,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 460 });

  const stateRef = useRef({
    busX: 100, busV: velocity, objX: 100, objV: velocity, t: 0, braking: false, samples: [] as LawSample[], stars: [] as any[],
  });
  const propsRef = useRef({ mass, friction, velocity, showVectors });
  propsRef.current = { mass, friction, velocity, showVectors };

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
      busX: 100, busV: velocity, objX: 140, objV: velocity, t: 0, braking: false, samples: [],
      stars: Array.from({ length: 60 }, () => ({
        x: Math.random() * size.w, y: Math.random() * size.h * 0.7,
        r: Math.random() * 1.4 + 0.3, a: Math.random() * 0.7 + 0.2,
      })),
    };
    onSamples([]);
  }, [resetTrigger, size.w, size.h, velocity, onSamples]);

  useEffect(() => {
    stateRef.current.braking = true;
  }, [brakeTrigger]);

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

      if (running) {
        st.t += dt;
        if (st.braking) {
          st.busV = Math.max(0, st.busV - 30 * dt);
        }
        const objAcc = -p.friction * 9.8 * Math.sign(st.objV || 1);
        st.objV += objAcc * dt;
        if (Math.abs(st.objV) < 0.05) st.objV = 0;
        st.busX += st.busV * dt * 30;
        st.objX += st.objV * dt * 30;
        if (st.busX > size.w + 200) { st.busX -= size.w + 400; st.objX -= size.w + 400; }

        st.samples.push({ t: st.t, v: st.objV, a: objAcc, x: st.objX / 30, f: p.friction * p.mass * 9.8 });
        if (st.samples.length > 200) st.samples.shift();
        if (st.samples.length % 4 === 0) onSamples([...st.samples]);

        liveAcc += dt;
        if (liveAcc > 0.1) {
          liveAcc = 0;
          onLive({ busV: st.busV, objV: st.objV, netF: st.braking ? -p.friction * p.mass * 9.8 : 0, inertia: p.mass * Math.abs(st.objV) });
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

      const dashOffset = (now / 30) % 40;
      ctx.strokeStyle = "rgba(180,120,255,0.3)";
      ctx.setLineDash([20, 20]); ctx.lineDashOffset = -dashOffset;
      ctx.beginPath(); ctx.moveTo(0, ground + 20); ctx.lineTo(size.w, ground + 20); ctx.stroke();
      ctx.setLineDash([]);

      const busW = 180, busH = 80, busY = ground - busH;
      const bx = st.busX;
      ctx.save();
      ctx.shadowColor = "#7c5fff"; ctx.shadowBlur = 20;
      const bg = ctx.createLinearGradient(bx, busY, bx, busY + busH);
      bg.addColorStop(0, "#7c5fff"); bg.addColorStop(1, "#3a2470");
      ctx.fillStyle = bg;
      roundRect(ctx, bx, busY, busW, busH, 10); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "rgba(125,211,252,0.6)";
      for (let i = 0; i < 4; i++) {
        roundRect(ctx, bx + 14 + i * 38, busY + 14, 28, 22, 3); ctx.fill();
      }
      ctx.fillStyle = "#1a0d2e";
      ctx.beginPath(); ctx.arc(bx + 35, ground - 4, 12, 0, Math.PI * 2);
      ctx.arc(bx + busW - 35, ground - 4, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bx + 35, ground - 4, 12, 0, Math.PI * 2);
      ctx.arc(bx + busW - 35, ground - 4, 12, 0, Math.PI * 2); ctx.stroke();

      const objSize = 18 + p.mass * 2;
      const ox = st.objX, oy = busY - objSize;
      ctx.save();
      ctx.shadowColor = "#ff8c42"; ctx.shadowBlur = 18;
      const og = ctx.createRadialGradient(ox + objSize / 2, oy + objSize / 2, 2, ox + objSize / 2, oy + objSize / 2, objSize);
      og.addColorStop(0, "#ffd166"); og.addColorStop(1, "#e85d3a");
      ctx.fillStyle = og;
      roundRect(ctx, ox, oy, objSize, objSize, 4); ctx.fill();
      ctx.restore();

      if (p.showVectors) {
        drawVector(ctx, ox + objSize / 2, oy - 10, st.objV * 8, 0, "#7dd3fc", "v");
        if (st.braking && Math.abs(st.objV) > 0.1) {
          drawVector(ctx, ox + objSize / 2, oy + objSize / 2, -p.friction * 40, 0, "#ff6ad8", "f");
        }
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
  ctx.lineTo(x + dx - 8 * Math.cos(ang - 0.4), y + dy - 8 * Math.sin(ang - 0.4));
  ctx.lineTo(x + dx - 8 * Math.cos(ang + 0.4), y + dy - 8 * Math.sin(ang + 0.4));
  ctx.closePath(); ctx.fill();
  ctx.font = "bold 12px monospace";
  ctx.fillText(label, x + dx + 6, y + dy - 4);
  ctx.restore();
}
