"use client";

import type { Station } from "@/lib/types";
import { useStore } from "@/lib/store";

type Filter = "this-week" | "this-month" | "later" | "all" | "submitted";

const FILTERS: { id: Filter; label: string; hint: string }[] = [
  { id: "this-week", label: "This week", hint: "≤ 7 days" },
  { id: "this-month", label: "This month", hint: "≤ 30 days" },
  { id: "later", label: "Later", hint: "> 30 days" },
  { id: "all", label: "All open", hint: "everything open" },
  { id: "submitted", label: "Submitted", hint: "what's done" },
];

function bucket(
  station: Station,
  f: Filter,
  nowMs: number
): boolean {
  if (f === "submitted") return station.status === "submitted";
  if (station.status === "submitted") return false;
  if (!nowMs) return f === "later"; // Pre-hydration: anything dated is "later"
  const days = Math.ceil(
    (new Date(station.due + "T23:59:59").getTime() - nowMs) / 86400000
  );
  if (f === "this-week") return days >= 0 && days <= 7;
  if (f === "this-month") return days >= 0 && days <= 30;
  if (f === "later") return days > 30;
  return true;
}

export function FilterStrip({ nowMs }: { nowMs?: number }) {
  const { stations, filter, setFilter, counts } = useStore();
  const effective = nowMs ?? 0;
  return (
    <nav
      aria-label="Filter stations"
      className="mt-7 flex flex-wrap items-center gap-2"
    >
      {FILTERS.map((f) => {
        const id = f.id as Filter;
        const count = stations.filter((s) => bucket(s, id, effective)).length;
        const active = filter === id;
        return (
          <button
            key={id}
            onClick={() => setFilter(id)}
            aria-pressed={active}
            className={`group flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs transition-colors ${
              active
                ? "border-bloom-deep bg-bloom/15 text-bloom"
                : "border-ink-line text-mist-dim hover:border-mist-dim hover:text-mist"
            }`}
          >
            <span className="font-medium">{f.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                active ? "bg-bloom/30 text-bloom" : "bg-ink-raised text-mist-dim"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}

      {/* Live hint — what's open, only when something is non-zero */}
      {counts.openThisWeek > 0 && counts.openThisWeek <= 3 && filter !== "this-week" && (
        <p className="ml-2 text-xs text-mist-dim">
          <button
            onClick={() => setFilter("this-week")}
            className="underline underline-offset-4 hover:text-bloom"
          >
            {counts.openThisWeek} this week →
          </button>
        </p>
      )}
    </nav>
  );
}
