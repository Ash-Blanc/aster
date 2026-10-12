"use client";

import { useEffect, useState } from "react";
import { Rail } from "@/components/rail";
import { AsterAgent } from "@/components/agent";
import { useStore, useDaysLeft } from "@/lib/store";

const phaseCopy: Record<string, string> = {
  idle: "Resting",
  thinking: "Thinking",
  acting: "Acting",
  awaiting: "Waiting on you",
};

const AGENT_ON = process.env.NEXT_PUBLIC_ASTER_AGENT === "on";

function Footer() {
  const { stations, resetDemo } = useStore();
  const openStations = stations.filter((s) => s.status !== "submitted");
  const nextDue = openStations.map((s) => s.due).sort()[0];
  const days = useDaysLeft(nextDue ?? "1970-01-01");

  return (
    <footer className="flex items-center justify-between gap-4 border-t border-ink-line px-6 py-3 text-xs text-mist-dim">
      <p>
        {stations.length} stations · {stations.filter((s) => s.status === "submitted").length}{" "}
        submitted
        {openStations.length > 0 && days !== null
          ? ` · next deadline in ${days} day${days === 1 ? "" : "s"}`
          : " · all clear"}
      </p>
      <button onClick={resetDemo} className="min-h-11 px-2 underline underline-offset-4 hover:text-bloom">
        Reset demo
      </button>
    </footer>
  );
}

export default function Home() {
  const { activity } = useStore();
  const [agentHealthy, setAgentHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    if (!AGENT_ON) return;
    fetch("/api/copilotkit")
      .then((r) => r.json())
      .then((d: { modelConfigured?: boolean }) => setAgentHealthy(Boolean(d.modelConfigured)))
      .catch(() => setAgentHealthy(false));
  }, []);

  const statusLabel = !AGENT_ON
    ? "Agent offline"
    : agentHealthy === false
      ? "Agent unreachable"
      : phaseCopy[activity.phase] ?? activity.phase;

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-ink-line px-6 py-4">
        <p className="font-display text-2xl text-mist">Aster</p>
        <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-mist-dim">
          <span
            aria-hidden
            className={`inline-block size-2 rounded-full ${
              activity.phase === "awaiting" ? "bg-bloom" : "bg-ink-line"
            }`}
          />
          {statusLabel}
        </p>
      </header>

      {!AGENT_ON && (
        <p role="status" className="border-b border-ink-line px-6 py-2 text-xs text-mist-dim">
          The agent is offline. Everything below works by hand — set OPENAI_API_KEY and{" "}
          NEXT_PUBLIC_ASTER_AGENT=on to bring Aster in.
        </p>
      )}

      <div className="flex flex-1 flex-col">
        <Rail />
      </div>

      <Footer />

      {AGENT_ON && <AsterAgent />}
    </main>
  );
}
