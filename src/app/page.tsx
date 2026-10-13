"use client";

import { Suspense, useEffect, useState } from "react";
import { Rail } from "@/components/rail";
import { AsterAgent } from "@/components/agent";
import { FilterStrip } from "@/components/filter-strip";
import { SubmittedGallery } from "@/components/submitted-gallery";
import { useStore } from "@/lib/store";

const phaseCopy: Record<string, string> = {
  idle: "Resting",
  thinking: "Thinking",
  acting: "Acting",
  awaiting: "Waiting on you",
};

const AGENT_ON = process.env.NEXT_PUBLIC_ASTER_AGENT === "on";

function Footer() {
  const { counts, resetDemo } = useStore();
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-ink-line px-6 py-3 text-xs text-mist-dim">
      <p>
        <span className="text-mist">{counts.open}</span> open ·{" "}
        <span className="text-mist">{counts.withOutline}</span> outlined ·{" "}
        <span className="text-mist">{counts.submitted}</span> submitted
        {counts.openThisWeek > 0 ? (
          <>
            {" "}· <span className="text-bloom">{counts.openThisWeek}</span>{" "}
            this week
          </>
        ) : null}
      </p>
      <p className="text-[11px] text-mist-dim/80">
        <kbd className="rounded border border-ink-line px-1.5 font-mono text-[10px]">J</kbd>
        {" "}/{" "}
        <kbd className="rounded border border-ink-line px-1.5 font-mono text-[10px]">K</kbd>
        {" "}to move ·{" "}
        <kbd className="rounded border border-ink-line px-1.5 font-mono text-[10px]">Enter</kbd>
        {" "}to open ·{" "}
        <kbd className="rounded border border-ink-line px-1.5 font-mono text-[10px]">L</kbd>
        {" "}to advance
      </p>
      <button
        onClick={() => {
          if (
            typeof window !== "undefined" &&
            window.confirm("Reset to the seed stations and answers?")
          ) {
            resetDemo();
          }
        }}
        className="min-h-11 px-2 underline underline-offset-4 hover:text-bloom"
      >
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
              activity.phase === "awaiting" ? "bg-bloom agent-wait-pulse" : "bg-ink-line"
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
        <div className="px-6 pt-9">
          <Suspense
            fallback={
              <div className="h-9 w-full animate-pulse rounded-md bg-ink-raised/60" aria-hidden />
            }
          >
            <FilterStrip />
          </Suspense>
        </div>
        <Rail />
      </div>

      <div className="px-6 pb-9">
        <SubmittedGallery />
      </div>

      <Footer />

      {AGENT_ON && <AsterAgent />}
    </main>
  );
}
