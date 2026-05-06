import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, Zap, Rocket, X, CircleStop } from "lucide-react";
import { PageWrapper } from "@/components/Card";
import { Crumbs } from "@/components/Crumbs";
import { HUD } from "@/components/sim/HUD";
import { LawControls } from "@/components/sim/laws/LawControls";
import { LawGraphPanel } from "@/components/sim/laws/LawGraphPanel";
import { FirstLawCanvas } from "@/components/sim/laws/FirstLawCanvas";
import { SecondLawCanvas } from "@/components/sim/laws/SecondLawCanvas";
import { ThirdLawCanvas } from "@/components/sim/laws/ThirdLawCanvas";
import type { LawSample } from "@/components/sim/laws/types";
import { PromptBox } from "@/components/sim/PromptBox";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const Route = createFileRoute("/simulation/class9/physics/laws-of-motion/")({
  component: LawsOfMotionLab,
});

type Tab = "first" | "second" | "third";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "first", label: "First Law", icon: Hand },
  { id: "second", label: "Second Law", icon: Zap },
  { id: "third", label: "Third Law", icon: Rocket },
];

function LawsOfMotionLab() {
  const [tab, setTab] = useState<Tab>("first");
  const [explainOpen, setExplainOpen] = useState(false);

  return (
    <PageWrapper>
      <Crumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Class 9", to: "/subjects/$classId", params: { classId: "9" } },
          { label: "Physics", to: "/chapters/$classId/$subject", params: { classId: "9", subject: "physics" } },
          { label: "Laws of Motion" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient">Newton's Laws of Motion · Lab</h1>
          <p className="text-sm text-muted-foreground">Three interactive simulations to feel inertia, force, and reaction.</p>
        </div>
        <div className="glass rounded-2xl p-1 flex gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white glow-purple"
                    : "hover:bg-white/5 text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "first" && <FirstLawTab onExplain={() => setExplainOpen(true)} />}
      {tab === "second" && <SecondLawTab onExplain={() => setExplainOpen(true)} />}
      {tab === "third" && <ThirdLawTab onExplain={() => setExplainOpen(true)} />}

      <AnimatePresence>
        {explainOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setExplainOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-3xl p-6 max-w-lg w-full neon-border relative"
            >
              <button onClick={() => setExplainOpen(false)} className="absolute top-4 right-4 glass rounded-full p-1.5">
                <X className="w-4 h-4" />
              </button>
              <ExplainContent tab={tab} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

function FirstLawTab({ onExplain }: { onExplain: () => void }) {
  const [mass, setMass] = useState(5);
  const [friction, setFriction] = useState(0.2);
  const [velocity, setVelocity] = useState(8);
  const [showVectors, setShowVectors] = useState(true);
  const [running, setRunning] = useState(true);
  const [brakeTrigger, setBrakeTrigger] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [samples, setSamples] = useState<LawSample[]>([]);
  const [live, setLive] = useState({ busV: 0, objV: 0, netF: 0, inertia: 0 });

  const onSamples = useCallback((s: LawSample[]) => setSamples(s), []);
  const onLive = useCallback((d: typeof live) => setLive(d), []);

  return (
    <>
      <HUD stats={[
        { label: "Bus Velocity", value: live.busV.toFixed(1), unit: "m/s", color: "#a78bfa" },
        { label: "Object Velocity", value: live.objV.toFixed(1), unit: "m/s", color: "#7dd3fc" },
        { label: "Net Force", value: live.netF.toFixed(1), unit: "N", color: "#f0abfc" },
        { label: "Inertia (p)", value: live.inertia.toFixed(1), unit: "kg·m/s", color: "#fda4af" },
      ]} />

      <div className="grid lg:grid-cols-[280px_1fr] gap-4 mt-4">
        <LawControls
          title="Inertia Parameters"
          sliders={[
            { label: "Mass", value: mass, min: 1, max: 20, unit: "kg", color: "#a78bfa", onChange: setMass },
            { label: "Friction μ", value: friction, min: 0, max: 1, step: 0.05, unit: "", color: "#7dd3fc", onChange: setFriction },
            { label: "Initial Velocity", value: velocity, min: 0, max: 20, unit: "m/s", color: "#f0abfc", onChange: setVelocity },
          ]}
          formulaTitle="Newton's First Law"
          formula="ΣF = 0  ⇒  Δv = 0"
          liveEquation="An object in motion stays in motion."
          showVectors={showVectors} setShowVectors={setShowVectors}
          running={running} onPlay={() => setRunning(true)} onPause={() => setRunning(false)}
          onReset={() => { setResetTrigger((n) => n + 1); setRunning(true); }}
          onAction={{ label: "Brake!", icon: <CircleStop className="w-4 h-4" />, onClick: () => setBrakeTrigger((n) => n + 1) }}
          onExplain={onExplain}
        />
        <div className="glass-strong rounded-3xl p-3 overflow-hidden">
          <FirstLawCanvas
            mass={mass} friction={friction} velocity={velocity}
            showVectors={showVectors} running={running}
            brakeTrigger={brakeTrigger} resetTrigger={resetTrigger}
            onSamples={onSamples} onLive={onLive}
          />
        </div>
      </div>

      <div className="mt-4">
        <LawGraphPanel samples={samples} series={[
          { title: "Velocity vs t", color: "#7dd3fc", unit: "m/s", get: (s) => s.v },
          { title: "Acceleration vs t", color: "#a78bfa", unit: "m/s²", get: (s) => s.a },
          { title: "Position vs t", color: "#f0abfc", unit: "m", get: (s) => s.x },
        ]} />
      </div>
      <PromptBox
        sim="first"
        current={{ mass, friction, velocity }}
        examples={["Heavy object on icy road", "Slam the brakes hard", "Light box high friction"]}
        onApply={(p) => {
          if (typeof p.mass === "number") setMass(clamp(p.mass, 1, 20));
          if (typeof p.friction === "number") setFriction(clamp(p.friction, 0, 1));
          if (typeof p.velocity === "number") setVelocity(clamp(p.velocity, 0, 20));
          if (p.brake) setTimeout(() => setBrakeTrigger((n) => n + 1), 80);
        }}
      />
    </>
  );
}

function SecondLawTab({ onExplain }: { onExplain: () => void }) {
  const [force, setForce] = useState(20);
  const [mass, setMass] = useState(5);
  const [showVectors, setShowVectors] = useState(true);
  const [running, setRunning] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [samples, setSamples] = useState<LawSample[]>([]);
  const [live, setLive] = useState({ force: 20, mass: 5, accel: 4, velocity: 0, displacement: 0 });

  const onSamples = useCallback((s: LawSample[]) => setSamples(s), []);
  const onLive = useCallback((d: typeof live) => setLive(d), []);

  const a = force / Math.max(0.1, mass);

  return (
    <>
      <HUD stats={[
        { label: "Force", value: force.toFixed(0), unit: "N", color: "#ff6ad8" },
        { label: "Mass", value: mass.toFixed(0), unit: "kg", color: "#a78bfa" },
        { label: "Acceleration", value: a.toFixed(2), unit: "m/s²", color: "#7dd3fc" },
        { label: "Velocity", value: live.velocity.toFixed(1), unit: "m/s", color: "#fda4af" },
      ]} />

      <div className="grid lg:grid-cols-[280px_1fr] gap-4 mt-4">
        <LawControls
          title="Force & Mass"
          sliders={[
            { label: "Applied Force", value: force, min: 0, max: 50, unit: "N", color: "#ff6ad8", onChange: setForce },
            { label: "Mass", value: mass, min: 1, max: 20, unit: "kg", color: "#a78bfa", onChange: setMass },
          ]}
          formulaTitle="Newton's Second Law"
          formula="F = m × a"
          liveEquation={`${force} N = ${mass} kg × ${a.toFixed(2)} m/s²`}
          showVectors={showVectors} setShowVectors={setShowVectors}
          running={running} onPlay={() => setRunning(true)} onPause={() => setRunning(false)}
          onReset={() => { setResetTrigger((n) => n + 1); setRunning(true); }}
          onExplain={onExplain}
        />
        <div className="glass-strong rounded-3xl p-3 overflow-hidden">
          <SecondLawCanvas
            force={force} mass={mass}
            showVectors={showVectors} running={running}
            resetTrigger={resetTrigger}
            onSamples={onSamples} onLive={onLive}
          />
        </div>
      </div>

      <div className="mt-4">
        <LawGraphPanel samples={samples} series={[
          { title: "Velocity vs t", color: "#7dd3fc", unit: "m/s", get: (s) => s.v },
          { title: "Acceleration vs t", color: "#a78bfa", unit: "m/s²", get: (s) => s.a },
          { title: "Force vs t", color: "#ff6ad8", unit: "N", get: (s) => s.f },
        ]} />
      </div>
      <PromptBox
        sim="second"
        current={{ force, mass }}
        examples={["Maximum force on tiny mass", "Heavy block, gentle push", "F=20N on 4kg"]}
        onApply={(p) => {
          if (typeof p.force === "number") setForce(clamp(p.force, 0, 50));
          if (typeof p.mass === "number") setMass(clamp(p.mass, 1, 20));
        }}
      />
    </>
  );
}

function ThirdLawTab({ onExplain }: { onExplain: () => void }) {
  const [thrust, setThrust] = useState(20);
  const [massA, setMassA] = useState(5);
  const [massB, setMassB] = useState(5);
  const [showVectors, setShowVectors] = useState(true);
  const [running, setRunning] = useState(true);
  const [launchTrigger, setLaunchTrigger] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [samples, setSamples] = useState<LawSample[]>([]);
  const [live, setLive] = useState({ thrust: 20, reaction: 20, momentum: 0, vA: 0, vB: 0 });

  const onSamples = useCallback((s: LawSample[]) => setSamples(s), []);
  const onLive = useCallback((d: typeof live) => setLive(d), []);

  return (
    <>
      <HUD stats={[
        { label: "Thrust (Action)", value: live.thrust.toFixed(0), unit: "N", color: "#f0abfc" },
        { label: "Reaction", value: live.reaction.toFixed(0), unit: "N", color: "#7dd3fc" },
        { label: "Momentum |p|", value: live.momentum.toFixed(1), unit: "kg·m/s", color: "#a78bfa" },
        { label: "Velocity B", value: live.vB.toFixed(1), unit: "m/s", color: "#fda4af" },
      ]} />

      <div className="grid lg:grid-cols-[280px_1fr] gap-4 mt-4">
        <LawControls
          title="Action–Reaction"
          sliders={[
            { label: "Thrust Force", value: thrust, min: 5, max: 50, unit: "N", color: "#ff6ad8", onChange: setThrust },
            { label: "Mass A", value: massA, min: 1, max: 20, unit: "kg", color: "#7dd3fc", onChange: setMassA },
            { label: "Mass B", value: massB, min: 1, max: 20, unit: "kg", color: "#f0abfc", onChange: setMassB },
          ]}
          formulaTitle="Newton's Third Law"
          formula="F_AB = − F_BA"
          liveEquation={`vA = ${live.vA.toFixed(2)} m/s · vB = ${live.vB.toFixed(2)} m/s`}
          showVectors={showVectors} setShowVectors={setShowVectors}
          running={running} onPlay={() => setRunning(true)} onPause={() => setRunning(false)}
          onReset={() => { setResetTrigger((n) => n + 1); setRunning(true); }}
          onAction={{ label: "Launch", icon: <Rocket className="w-4 h-4" />, onClick: () => setLaunchTrigger((n) => n + 1) }}
          onExplain={onExplain}
        />
        <div className="glass-strong rounded-3xl p-3 overflow-hidden">
          <ThirdLawCanvas
            thrust={thrust} massA={massA} massB={massB}
            showVectors={showVectors} running={running}
            launchTrigger={launchTrigger} resetTrigger={resetTrigger}
            onSamples={onSamples} onLive={onLive}
          />
        </div>
      </div>

      <div className="mt-4">
        <LawGraphPanel samples={samples} series={[
          { title: "Velocity B vs t", color: "#7dd3fc", unit: "m/s", get: (s) => s.v },
          { title: "Position B vs t", color: "#f0abfc", unit: "m", get: (s) => s.x },
          { title: "Force vs t", color: "#ff6ad8", unit: "N", get: (s) => s.f },
        ]} />
      </div>
      <PromptBox
        sim="third"
        current={{ thrust, massA, massB }}
        examples={["Tiny rocket, heavy payload", "Equal masses, max thrust", "Launch the skaters now"]}
        onApply={(p) => {
          if (typeof p.thrust === "number") setThrust(clamp(p.thrust, 5, 50));
          if (typeof p.massA === "number") setMassA(clamp(p.massA, 1, 20));
          if (typeof p.massB === "number") setMassB(clamp(p.massB, 1, 20));
          if (p.launch) setTimeout(() => setLaunchTrigger((n) => n + 1), 80);
        }}
      />
    </>
  );
}

function ExplainContent({ tab }: { tab: Tab }) {
  if (tab === "first") {
    return (
      <>
        <h2 className="text-xl font-bold text-gradient mb-3">First Law — Inertia</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>An object continues in its state of rest or uniform motion unless acted upon by an external force. When the bus brakes suddenly, the object on top has no horizontal force acting on it instantly, so it keeps moving forward.</p>
          <p>Friction (μ) is what eventually slows the sliding object down. Heavier objects (more mass) carry more <em>momentum</em> and resist change more strongly.</p>
        </div>
      </>
    );
  }
  if (tab === "second") {
    return (
      <>
        <h2 className="text-xl font-bold text-gradient mb-3">Second Law — F = ma</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>The acceleration of an object is directly proportional to the net force applied and inversely proportional to its mass.</p>
          <p>Try doubling the force — acceleration doubles. Double the mass and acceleration halves. The pink arrow shows force, blue shows acceleration, red shows current velocity.</p>
        </div>
      </>
    );
  }
  return (
    <>
      <h2 className="text-xl font-bold text-gradient mb-3">Third Law — Action & Reaction</h2>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>For every action there is an equal and opposite reaction. When skater A pushes B, B pushes A back with the same force in the opposite direction.</p>
        <p>Even though forces are equal, accelerations are not — the lighter skater accelerates more (a = F/m). This is why a rocket's tiny exhaust mass moving fast can push a huge rocket forward.</p>
      </div>
    </>
  );
}
