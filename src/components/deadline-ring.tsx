"use client";

import { useDaysLeft } from "@/lib/store";

// Calm circular progress ring around a station card's deadline.
// Inner radius is large so the ring reads as a quiet emphasis, not a clock.
// Reduced-motion is honored via CSS — no JS animation here.
const SIZE = 44;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Horizon: 30 days. Anything past that fills almost half the ring — we don't want pressure panic.
const HORIZON_DAYS = 30;

export function DeadlineRing({ due, dim }: { due: string; dim?: boolean }) {
  const days = useDaysLeft(due);
  if (days === null) {
    return <div aria-hidden className="size-11" />;
  }
  const safeDays = Math.max(days, 0);
  // Fill grows as the deadline approaches. Past due → full ring in deep accent.
  const ratio =
    safeDays <= 0
      ? 1
      : Math.max(0.05, Math.min(1, 1 - safeDays / HORIZON_DAYS));
  const offset = CIRCUMFERENCE * (1 - ratio);
  const phase = safeDays <= 0 ? "past" : safeDays <= 7 ? "soon" : "later";
  const label =
    safeDays <= 0
      ? "past"
      : safeDays === 1
        ? "1 day"
        : `${safeDays}d`;
  const hint =
    safeDays <= 0
      ? "Past due"
      : safeDays === 1
        ? "Due tomorrow"
        : `${safeDays} day${safeDays === 1 ? "" : "s"} left`;

  return (
    <div
      className={`relative flex size-11 items-center justify-center ${dim ? "opacity-40" : ""}`}
      role="img"
      aria-label={hint}
      title={hint}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-ink-line"
          fill="none"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className={
            phase === "past"
              ? "text-bloom-deep"
              : phase === "soon"
                ? "text-bloom"
                : "text-mist-dim"
          }
        />
      </svg>
      <span
        className={`absolute font-display text-[11px] tabular-nums ${
          phase === "past"
            ? "text-bloom-deep"
            : phase === "soon"
              ? "text-bloom"
              : "text-mist-dim"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
