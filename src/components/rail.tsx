"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore, useDaysLeft } from "@/lib/store";
import type { Station, StationStatus } from "@/lib/types";
import { StationDetail } from "./station-detail";
import { DeadlineRing } from "./deadline-ring";

const statusCopy: Record<StationStatus, string> = {
  planned: "Planned",
  drafting: "Drafting",
  review: "In review",
  submitted: "Submitted",
};

const kindCopy: Record<Station["kind"], string> = {
  hackathon: "Hackathon",
  college: "College",
  scholarship: "Scholarship",
  olympiad: "Olympiad",
};

function StationCard({
  station,
  index,
  onOpen,
  focused,
}: {
  station: Station;
  index: number;
  onOpen: (id: string) => void;
  focused: boolean;
}) {
  const { submitStation, activity, setActivity } = useStore();
  const days = useDaysLeft(station.due);
  const soon = days !== null && days <= 14 && station.status !== "submitted";
  const agentHere = activity.stationId === station.id && activity.phase !== "idle";
  const open = station.prompts.length > 0 ? station.prompts[0] : null;
  const [blooming, setBlooming] = useState(false);

  const submit = () => {
    submitStation(station.id);
    setActivity({ phase: "idle", label: "Aster is resting" });
    setBlooming(true);
    setTimeout(() => setBlooming(false), 950);
  };

  return (
    <article
      aria-label={station.name}
      style={{ animationDelay: `${index * 40}ms` }}
      data-station-id={station.id}
      className={`beat-in relative flex w-72 shrink-0 flex-col gap-4 rounded-md border p-6 outline-none transition-shadow ${
        agentHere
          ? "agent-live border-bloom-deep"
          : soon
            ? "border-bloom/40"
            : "border-ink-line bg-ink-raised"
      } ${focused ? "ring-1 ring-bloom/60 ring-offset-2 ring-offset-ink" : ""}`}
    >
      {blooming && (
        <span
          aria-hidden
          className="bloom-flood pointer-events-none absolute inset-0 rounded-md bg-bloom/30"
        />
      )}

      <button
        onClick={() => onOpen(station.id)}
        className="absolute inset-0 rounded-md"
        aria-label={`Open ${station.name} details`}
      />

      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl text-mist">{station.name}</h2>
        <span className="text-xs uppercase tracking-widest text-mist-dim">
          {statusCopy[station.status]}
        </span>
      </div>

      <p className="flex items-center gap-3 text-xs text-mist-dim">
        <span className="rounded-sm border border-ink-line px-1.5 py-0.5 uppercase tracking-widest">
          {kindCopy[station.kind]}
        </span>
        {station.url && (
          <span
            role="link"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              window.open(station.url, "_blank", "noreferrer");
            }}
            className="cursor-pointer underline underline-offset-4 hover:text-bloom"
          >
            Official site
          </span>
        )}
      </p>

      <div className="flex items-center justify-between gap-3">
        <DeadlineRing
          due={station.due}
          dim={station.status === "submitted"}
        />
        <p
          className={`text-right text-sm ${soon ? "text-bloom" : "text-mist-dim"}`}
          aria-live="polite"
        >
          {station.status === "submitted"
            ? "Done. Nothing left to do."
            : days === null
              ? "Checking the calendar…"
              : `Due in ${days} day${days === 1 ? "" : "s"}`}
        </p>
      </div>

      {open ? (
        <div className="pointer-events-none flex flex-1 flex-col gap-2">
          <p className="font-display text-lg italic leading-snug text-mist">“{open.text}”</p>
          <p className="text-xs text-mist-dim">
            {open.words} words
            {open.outline ? ` · ${open.outline.length} beats outlined` : " · no outline yet"}
          </p>
        </div>
      ) : (
        <p className="pointer-events-none flex-1 text-sm text-mist-dim">
          No prompts loaded yet. Ask Aster to pull them, or add one in the details.
        </p>
      )}

      {station.status !== "submitted" && (
        <button
          id={`submit-${station.id}`}
          onClick={(e) => {
            e.stopPropagation();
            submit();
          }}
          className="relative z-10 min-h-11 rounded-sm border border-ink-line px-4 text-sm text-mist transition-colors hover:border-bloom-deep hover:text-bloom"
        >
          Mark submitted
        </button>
      )}
    </article>
  );
}

function AddStation({ onAdded }: { onAdded: () => void }) {
  const { addStation } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Station["kind"]>("hackathon");
  const [due, setDue] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Add a station"
        className="flex min-h-44 w-72 shrink-0 items-center justify-center rounded-md border border-dashed border-ink-line text-3xl text-mist-dim transition-colors hover:border-bloom-deep hover:text-bloom"
      >
        +
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name || !due) return;
        addStation({ name, kind, due });
        setOpen(false);
        onAdded();
      }}
      className="flex w-72 shrink-0 flex-col gap-3 rounded-md border border-ink-line bg-ink-raised p-6"
    >
      <h2 className="font-display text-2xl text-mist">New station</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="What are you applying to?"
        aria-label="Station name"
        className="min-h-11 rounded-sm border border-ink-line bg-transparent px-3 text-sm text-mist"
      />
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as Station["kind"])}
        aria-label="Kind"
        className="min-h-11 rounded-sm border border-ink-line bg-ink px-3 text-sm text-mist"
      >
        <option value="hackathon">Hackathon</option>
        <option value="college">College</option>
        <option value="scholarship">Scholarship</option>
        <option value="olympiad">Olympiad</option>
      </select>
      <input
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        aria-label="Deadline"
        className="min-h-11 rounded-sm border border-ink-line bg-ink px-3 text-sm text-mist"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name || !due}
          className="min-h-11 flex-1 rounded-sm bg-bloom px-4 text-sm font-medium text-ink disabled:opacity-40"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-11 rounded-sm border border-ink-line px-4 text-sm text-mist"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function NextLine() {
  const { stations } = useStore();
  const next = stations
    .filter((s) => s.status !== "submitted")
    .sort((a, b) => a.due.localeCompare(b.due))[0];
  const days = useDaysLeft(next?.due ?? "1970-01-01");

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-4xl text-mist">
        {next ? (
          <>
            Next up: <span className="text-bloom">{next.name}</span>
            {days !== null ? (
              <>
                , in {days} day{days === 1 ? "" : "s"}.
              </>
            ) : (
              "."
            )}
          </>
        ) : (
          <>Everything submitted. Go outside.</>
        )}
      </h1>
      <p className="text-mist-dim">Aster only writes outlines. The words are yours.</p>
    </div>
  );
}

function bucket(
  station: Station,
  f: ReturnType<typeof useStore>["filter"],
  nowMs: number
): boolean {
  if (f === "submitted") return station.status === "submitted";
  if (station.status === "submitted") return false;
  if (!nowMs) return f === "later";
  const days = Math.ceil(
    (new Date(station.due + "T23:59:59").getTime() - nowMs) / 86400000
  );
  if (f === "this-week") return days >= 0 && days <= 7;
  if (f === "this-month") return days >= 0 && days <= 30;
  if (f === "later") return days > 30;
  return true;
}

export function Rail() {
  const { stations, loaded, activity, filter, focusedStationId, advanceStation, setFocusedStation } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  // Read "now" from a local state that mirrors StoreProvider — keeps SSR safe.
  const [nowMs, setNowMs] = useState<number>(0);
  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  const visible = useMemo(
    () => stations.filter((s) => bucket(s, filter, nowMs)),
    [stations, filter, nowMs]
  );

  // Keyboard navigation:
  //   j / ArrowRight → next visible station
  //   k / ArrowLeft  → previous visible station
  //   Enter / Space  → open focused station
  //   L              → advance focused station's status
  //   1-5            → set filter (this-week, this-month, later, all, submitted)
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ignore when user is typing
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (openId) return; // modal open — details panel handles its own keys

      if (visible.length === 0) return;

      if (e.key === "j" || e.key === "ArrowRight") {
        e.preventDefault();
        const idx = visible.findIndex((s) => s.id === focusedStationId);
        const nextIdx = idx < 0 ? 0 : Math.min(idx + 1, visible.length - 1);
        setFocusedStation(visible[nextIdx].id);
      } else if (e.key === "k" || e.key === "ArrowLeft") {
        e.preventDefault();
        const idx = visible.findIndex((s) => s.id === focusedStationId);
        const prevIdx = idx < 0 ? 0 : Math.max(idx - 1, 0);
        setFocusedStation(visible[prevIdx].id);
      } else if (e.key === "Enter" || e.key === " ") {
        if (focusedStationId) {
          e.preventDefault();
          setOpenId(focusedStationId);
        }
      } else if (e.key === "l" || e.key === "L") {
        if (focusedStationId) {
          e.preventDefault();
          advanceStation(focusedStationId);
        }
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, focusedStationId, openId, advanceStation, setFocusedStation]);

  // Scroll focused station into view when it changes via keys.
  useEffect(() => {
    if (!focusedStationId) return;
    const el = document.querySelector(
      `[data-station-id="${CSS.escape(focusedStationId)}"]`
    );
    if (el && "scrollIntoView" in el) {
      (el as HTMLElement).scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [focusedStationId]);

  return (
    <section aria-label="Application rail" className="flex-1 overflow-x-auto px-6 py-9">
      <NextLine />

      <div className="mt-9 flex items-stretch gap-4" role="list">
        {!loaded
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                aria-hidden
                className="h-64 w-72 shrink-0 animate-pulse rounded-md border border-ink-line bg-ink-raised/50"
              />
            ))
          : visible.map((s, i) => (
              <StationCard
                key={s.id}
                station={s}
                index={i}
                onOpen={(id) => {
                  setOpenId(id);
                  setFocusedStation(id);
                }}
                focused={focusedStationId === s.id}
              />
            ))}
        {loaded && visible.length === 0 && (
          <p className="text-mist-dim">
            Nothing matches this filter yet — try another bucket.
          </p>
        )}
        {loaded && <AddStation onAdded={() => undefined} />}
      </div>

      {activity.stationId && openId !== activity.stationId && activity.phase === "awaiting" && (
        <p className="mt-4 text-sm text-bloom" role="status">
          Aster is waiting on your call — check the sidebar.
        </p>
      )}

      {openId && <StationDetail stationId={openId} onClose={() => setOpenId(null)} />}
    </section>
  );
}
