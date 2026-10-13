"use client";

import { useStore, useDaysLeft } from "@/lib/store";

// Submitted gallery: stationary badges of what's already shipped.
// Lives below the rail so it doesn't compete with the active line.
export function SubmittedGallery() {
  const { stations } = useStore();
  const done = stations.filter((s) => s.status === "submitted");
  if (done.length === 0) return null;
  return (
    <section
      aria-label="Submitted"
      className="mt-10 border-t border-ink-line pt-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xs uppercase tracking-widest text-mist-dim">
          Submitted · {done.length}
        </h3>
        <p className="text-[11px] text-mist-dim">
          Words are yours. Outlines just helped you find them.
        </p>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {done.map((s) => (
          <SubmittedChip key={s.id} stationId={s.id} name={s.name} due={s.due} />
        ))}
      </ul>
    </section>
  );
}

function SubmittedChip({
  stationId,
  name,
  due,
}: {
  stationId: string;
  name: string;
  due: string;
}) {
  const days = useDaysLeft(due);
  return (
    <li
      aria-label={`${name}, submitted`}
      className="flex min-h-9 items-center gap-2 rounded-full border border-ink-line bg-ink-raised px-3 text-xs text-mist-dim"
    >
      <span aria-hidden className="size-1.5 rounded-full bg-bloom-deep" />
      <span className="text-mist">{name}</span>
      {days !== null && (
        <span className="text-[10px] tabular-nums text-mist-dim">
          · {days >= 0 ? `closed ${days}d ago` : `${Math.abs(days)}d ago`}
        </span>
      )}
    </li>
  );
}
