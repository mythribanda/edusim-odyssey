import { useEffect, useRef, useState, useCallback } from "react";
import { GRAVITIES, type GravityKey, trajectoryPoints } from "@/physics/projectile";

export type LiveStats = {
  power: number;
  angle: number;
  range: number;
  height: number;
  tof: number;
  impactSpeed: number;
};

export type Sample = { t: number; vx: number; vy: number; h: number };

type Props = {
  gravityKey: GravityKey;
  onStats: (s: LiveStats) => void;
  onSamples: (s: Sample[]) => void;
  onHit: (count: number) => void;
  launchTrigger: number;
  resetTrigger: number;
  replayTrigger: number;
  onPowerAngle: (p: number, a: number) => void;
  aim?: { power: number; angle: number } | null;
};

type Target = { x: number; y: number; w: number; h: number; alive: boolean };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const PIXELS_PER_M = 6;

export function CanvasGame({
  gravityKey, onStats, onSamples, onHit,
  launchTrigger, resetTrigger, replayTrigger, onPowerAngle, aim,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 460 });

  const slingRef = useRef({ x: 90, y: 0 });
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const projectileRef = useRef<{
    active: boolean; x: number; y: number; vx: number; vy: number; t: number; trail: { x: number; y: number }[];
  } | null>(null);
  const targetsRef = useRef<Target[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const hitsRef = useRef(0);
  const lastLaunchRef = useRef<{ power: number; angle: number } | null>(null);
  const samplesRef = useRef<Sample[]>([]);

  const resetTargets = useCallback(() => {
    const ground = size.h - 40;
    targetsRef.current = [
      { x: size.w * 0.55, y: ground - 30, w: 30, h: 30, alive: true },
      { x: size.w * 0.65, y: ground - 60, w: 30, h: 60, alive: true },
      { x: size.w * 0.75, y: ground - 30, w: 30, h: 30, alive: true },
      { x: size.w * 0.85, y: ground - 80, w: 30, h: 80, alive: true },
    ];
    hitsRef.current = 0;
  }, [size.w, size.h]);

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
        const h = Math.max(360, Math.min(540, w * 0.55));
        setSize({ w, h });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    slingRef.current = { x: 90, y: size.h - 40 - 70 };
    resetTargets();
    projectileRef.current = null;
    particlesRef.current = [];
    samplesRef.current = [];
    onSamples([]);
    onHit(0);
    onStats({ power: 0, angle: 0, range: 0, height: 0, tof: 0, impactSpeed: 0 });
  }, [size.w, size.h, resetTrigger, resetTargets, onSamples, onHit, onStats]);

  useEffect(() => {
    if (!lastLaunchRef.current) return;
    launchProjectile(lastLaunchRef.current.power, lastLaunchRef.current.angle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayTrigger]);

  useEffect(() => {
    if (launchTrigger === 0) return;
    if (dragRef.current.active) {
      const { power, angle } = computeDrag();
      launchProjectile(power, angle);
    } else if (aim) {
      launchProjectile(aim.power, aim.angle);
    } else if (lastLaunchRef.current) {
      launchProjectile(lastLaunchRef.current.power, lastLaunchRef.current.angle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchTrigger]);

  function computeDrag() {
    const sling = slingRef.current;
    const dx = sling.x - dragRef.current.x;
    const dy = sling.y - dragRef.current.y;
    const dist = Math.min(Math.hypot(dx, dy), 110);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const power = (dist / 110) * 40;
    return { power, angle: Math.max(5, Math.min(85, angle)) };
  }

  function launchProjectile(power: number, angleDeg: number) {
    const g = GRAVITIES[gravityKey];
    const a = (angleDeg * Math.PI) / 180;
    projectileRef.current = {
      active: true,
      x: slingRef.current.x,
      y: slingRef.current.y,
      vx: power * Math.cos(a),
      vy: -power * Math.sin(a),
      t: 0,
      trail: [],
    };
    lastLaunchRef.current = { power, angle: angleDeg };
    samplesRef.current = [];
    resetTargets();
    onHit(0);
    onStats({
      power, angle: angleDeg,
      range: (power * power * Math.sin(2 * a)) / g,
      height: (power * power * Math.sin(a) ** 2) / (2 * g),
      tof: (2 * power * Math.sin(a)) / g,
      impactSpeed: power,
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let prev = performance.now();

    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * size.w,
      y: Math.random() * size.h * 0.7,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random() * 0.7 + 0.2,
    }));

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - prev) / 1000);
      prev = now;
      const g = GRAVITIES[gravityKey];
      const ground = size.h - 40;

      ctx.clearRect(0, 0, size.w, size.h);

      const grad = ctx.createLinearGradient(0, 0, 0, size.h);
      grad.addColorStop(0, "#0b0a1f");
      grad.addColorStop(0.6, "#15102e");
      grad.addColorStop(1, "#1a0d2e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size.w, size.h);

      ctx.fillStyle = "white";
      stars.forEach((s) => {
        ctx.globalAlpha = s.a * (0.6 + 0.4 * Math.sin(now / 800 + s.x));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      const groundGrad = ctx.createLinearGradient(0, ground, 0, size.h);
      groundGrad.addColorStop(0, "#3d2469");
      groundGrad.addColorStop(1, "#1a0d2e");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, ground, size.w, size.h - ground);
      ctx.strokeStyle = "rgba(180,120,255,0.5)";
      ctx.beginPath();
      ctx.moveTo(0, ground);
      ctx.lineTo(size.w, ground);
      ctx.stroke();

      const sling = slingRef.current;
      ctx.strokeStyle = "#6b3e1f";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(sling.x - 12, ground);
      ctx.lineTo(sling.x - 6, sling.y + 4);
      ctx.moveTo(sling.x + 12, ground);
      ctx.lineTo(sling.x + 6, sling.y + 4);
      ctx.stroke();

      const proj = projectileRef.current;
      let birdPos = { x: sling.x, y: sling.y };
      if (dragRef.current.active && !proj?.active) {
        birdPos = { x: dragRef.current.x, y: dragRef.current.y };
        ctx.strokeStyle = "rgba(255,200,80,0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sling.x - 6, sling.y + 4);
        ctx.lineTo(birdPos.x, birdPos.y);
        ctx.lineTo(sling.x + 6, sling.y + 4);
        ctx.stroke();

        const { power, angle } = computeDrag();
        onPowerAngle(power, angle);
        const pts = trajectoryPoints(power, angle, g, 30);
        ctx.strokeStyle = "rgba(180,120,255,0.55)";
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        pts.forEach((p, i) => {
          const px = sling.x + p.x * PIXELS_PER_M;
          const py = sling.y - p.y * PIXELS_PER_M;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (proj && proj.active) {
        proj.t += dt;
        proj.x += proj.vx * dt * PIXELS_PER_M;
        proj.y += proj.vy * dt * PIXELS_PER_M;
        proj.vy += g * dt;
        proj.trail.push({ x: proj.x, y: proj.y });
        if (proj.trail.length > 60) proj.trail.shift();

        samplesRef.current.push({
          t: proj.t,
          vx: proj.vx,
          vy: -proj.vy,
          h: Math.max(0, (sling.y - proj.y) / PIXELS_PER_M),
        });
        if (samplesRef.current.length % 3 === 0) onSamples([...samplesRef.current]);

        for (const tg of targetsRef.current) {
          if (!tg.alive) continue;
          if (proj.x > tg.x && proj.x < tg.x + tg.w && proj.y > tg.y && proj.y < tg.y + tg.h) {
            tg.alive = false;
            hitsRef.current += 1;
            onHit(hitsRef.current);
            spawnParticles(proj.x, proj.y, "#ff6ad8");
            proj.vx *= 0.4;
            proj.vy = -Math.abs(proj.vy) * 0.5;
          }
        }

        if (proj.y >= ground) {
          proj.y = ground;
          spawnParticles(proj.x, ground, "#a78bfa");
          const speed = Math.hypot(proj.vx, proj.vy);
          proj.active = false;
          onSamples([...samplesRef.current]);
          onStatsUpdate(speed);
        }

        ctx.strokeStyle = "rgba(180,120,255,0.9)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#a78bfa";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        proj.trail.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        birdPos = { x: proj.x, y: proj.y };
      }

      targetsRef.current.forEach((tg) => {
        if (!tg.alive) return;
        const grd = ctx.createLinearGradient(tg.x, tg.y, tg.x, tg.y + tg.h);
        grd.addColorStop(0, "#7c5fff");
        grd.addColorStop(1, "#3a2470");
        ctx.fillStyle = grd;
        ctx.shadowColor = "#7c5fff";
        ctx.shadowBlur = 14;
        roundRect(ctx, tg.x, tg.y, tg.w, tg.h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(tg.x + tg.w / 2 - 5, tg.y + 10, 2, 0, Math.PI * 2);
        ctx.arc(tg.x + tg.w / 2 + 5, tg.y + 10, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
      particlesRef.current.forEach((p) => {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.save();
      ctx.shadowColor = "#ff8c42";
      ctx.shadowBlur = 16;
      const bg = ctx.createRadialGradient(birdPos.x, birdPos.y, 2, birdPos.x, birdPos.y, 14);
      bg.addColorStop(0, "#ffd166");
      bg.addColorStop(1, "#e85d3a");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(birdPos.x, birdPos.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(birdPos.x + 4, birdPos.y - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(birdPos.x + 4, birdPos.y - 3, 1, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(tick);
    };

    function onStatsUpdate(impact: number) {
      const last = lastLaunchRef.current;
      if (!last) return;
      const g = GRAVITIES[gravityKey];
      const a = (last.angle * Math.PI) / 180;
      onStats({
        power: last.power, angle: last.angle,
        range: (last.power * last.power * Math.sin(2 * a)) / g,
        height: (last.power * last.power * Math.sin(a) ** 2) / (2 * g),
        tof: (2 * last.power * Math.sin(a)) / g,
        impactSpeed: impact,
      });
    }

    function spawnParticles(x: number, y: number, color: string) {
      for (let i = 0; i < 24; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = Math.random() * 180 + 40;
        particlesRef.current.push({
          x, y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 60,
          life: 0.8,
          color,
        });
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size.w, size.h, gravityKey, onStats, onSamples, onHit, onPowerAngle]);

  function getMouse(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        width={size.w}
        height={size.h}
        className="w-full rounded-3xl cursor-grab active:cursor-grabbing"
        style={{ height: size.h }}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture(e.pointerId);
          const m = getMouse(e);
          if (Math.hypot(m.x - slingRef.current.x, m.y - slingRef.current.y) < 80) {
            dragRef.current = { active: true, x: m.x, y: m.y };
          }
        }}
        onPointerMove={(e) => {
          if (!dragRef.current.active) return;
          const m = getMouse(e);
          dragRef.current.x = Math.min(slingRef.current.x - 5, m.x);
          dragRef.current.y = Math.min(slingRef.current.y + 80, Math.max(20, m.y));
        }}
        onPointerUp={() => {
          if (!dragRef.current.active) return;
          const { power, angle } = computeDrag();
          dragRef.current.active = false;
          if (power > 3) launchProjectile(power, angle);
        }}
      />
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
