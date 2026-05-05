export type Vec = { x: number; y: number };

export type ProjectileState = {
  pos: Vec;
  vel: Vec;
  t: number;
  alive: boolean;
};

export const GRAVITIES = {
  Earth: 9.8,
  Moon: 1.6,
  Mars: 3.7,
} as const;

export type GravityKey = keyof typeof GRAVITIES;

export function range(v: number, angleDeg: number, g: number) {
  const a = (angleDeg * Math.PI) / 180;
  return (v * v * Math.sin(2 * a)) / g;
}

export function maxHeight(v: number, angleDeg: number, g: number) {
  const a = (angleDeg * Math.PI) / 180;
  return (v * v * Math.sin(a) ** 2) / (2 * g);
}

export function timeOfFlight(v: number, angleDeg: number, g: number) {
  const a = (angleDeg * Math.PI) / 180;
  return (2 * v * Math.sin(a)) / g;
}

export function trajectoryPoints(
  v: number,
  angleDeg: number,
  g: number,
  steps = 60,
): Vec[] {
  const T = timeOfFlight(v, angleDeg, g);
  const a = (angleDeg * Math.PI) / 180;
  const vx = v * Math.cos(a);
  const vy = v * Math.sin(a);
  const pts: Vec[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (T * i) / steps;
    pts.push({ x: vx * t, y: vy * t - 0.5 * g * t * t });
  }
  return pts;
}
