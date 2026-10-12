"use client";

import { useEffect, useState } from "react";
import { useDaysLeft, useStore } from "@/lib/store";
import type { Station, StationStatus } from "@/lib/types";

const statusCopy: Record<StationStatus, string> = {
  planned: "Planned",
  drafting: "Drafting",
  review: "In review",
  submitted: "Submitted",
};

const nextStatus: Record<Exclude<StationStatus, "submitted">, StationStatus> = {
  planned: "drafting",
  drafting: "review",
  review: "submitted",
};

export function StationDetail({ stationId, onClose }: { stationId: string; onClose: () => void }) {
  const { stations, answers, setActivity, updatePromptNotes, renameOutlineBeat, deleteOutlineBeat, addAnswer, attachAnswerToPrompt } =
    useStore();
  const station = stations.find((s) => s.id === stationId);
  const days = useDaysLeft(station?.due ?? "1970-01-01");
  const [newAnswerTitle, setNewAnswerTitle] = useState("");
  const [newAnswerText, setNewAnswerText] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!station) return null;

  const advance = () => {
    if (station.status === "submitted") return;
    const upcoming = nextStatus[station.status];
    if (upcoming === "submitted") {
      // routed through the card's submit path so the bloom plays
      document.getElementById(`submit-${station.id}`)?.click();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label={`${station.name} details`}>
      <button aria-label="Close details" onClick={onClose} className="flex-1 bg-black/50" />
      <aside className="flex w-full max-w-md flex-col gap-6 overflow-y-auto border-l border-ink-line bg-ink p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl text-mist">{station.name}</h2>
            <p className="mt-1 text-sm text-mist-dim">
              {station.kind} · due {station.due}
              {days !== null ? ` (${days} day${days === 1 ? "" : "s"} left)` : ""}
              {station.url && (
                <>
                  {" · "}
                  <a href={station.url} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-bloom">
                    Official site
                  </a>
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-h-11 rounded-sm border border-ink-line px-3 text-sm text-mist hover:border-bloom-deep hover:text-bloom"
          >
            Close
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-sm border border-ink-line px-2 py-1 text-xs uppercase tracking-widest text-mist-dim">
            {statusCopy[station.status]}
          </span>
          {station.status !== "submitted" && (
            <button
              onClick={advance}
              className="min-h-11 rounded-sm border border-ink-line px-3 text-sm text-mist hover:border-bloom-deep hover:text-bloom"
            >
              Move to {statusCopy[nextStatus[station.status]]}
            </button>
          )}
        </div>

        <section className="flex flex-col gap-4">
          <h3 className="text-xs uppercase tracking-widest text-mist-dim">Prompts</h3>
          {station.prompts.length === 0 && (
            <p className="text-sm text-mist-dim">
              No prompts yet. Ask Aster to pull them, or attach one when the portal opens.
            </p>
          )}
          {station.prompts.map((p) => (
            <article key={p.id} className="flex flex-col gap-2 rounded-md border border-ink-line bg-ink-raised p-4">
              <p className="font-display text-lg italic text-mist">“{p.text}”</p>
              <p className="text-xs text-mist-dim">
                {p.words} words · {p.outline?.length ?? 0} beats outlined
              </p>

              {p.outline && p.outline.length > 0 && (
                <ol className="list-decimal space-y-2 pl-5 text-sm">
                  {p.outline.map((o) => (
                    <li key={o.id} className="flex items-center gap-2">
                      <input
                        aria-label="Rename beat"
                        value={o.beat}
                        onChange={(e) => renameOutlineBeat(station.id, p.id, o.id, e.target.value)}
                        className="min-w-0 flex-1 border-b border-ink-line bg-transparent pb-0.5 text-mist focus-visible:outline-none"
                      />
                      <button
                        aria-label={`Delete beat ${o.beat}`}
                        onClick={() => deleteOutlineBeat(station.id, p.id, o.id)}
                        className="min-h-11 px-2 text-xs text-mist-dim hover:text-bloom"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ol>
              )}

              <label className="text-xs uppercase tracking-widest text-mist-dim" htmlFor={`notes-${p.id}`}>
                Notes
              </label>
              <textarea
                id={`notes-${p.id}`}
                value={p.notes ?? ""}
                onChange={(e) => updatePromptNotes(station.id, p.id, e.target.value)}
                placeholder="Hooks, fragments, reminders — your words."
                className="min-h-16 rounded-sm border border-ink-line bg-transparent p-2 text-sm text-mist"
              />

              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor={`attach-${p.id}`} className="text-xs text-mist-dim">
                  Reuse from bank:
                </label>
                <select
                  id={`attach-${p.id}`}
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) attachAnswerToPrompt(station.id, p.id, e.target.value);
                    e.target.value = "";
                  }}
                  className="min-h-11 rounded-sm border border-ink-line bg-ink px-2 text-sm text-mist"
                >
                  <option value="">Pick an answer…</option>
                  {answers.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>
            </article>
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs uppercase tracking-widest text-mist-dim">Answer bank</h3>
          <ul className="flex flex-col gap-2">
            {answers.map((a) => (
              <li key={a.id} className="rounded-md border border-ink-line bg-ink-raised p-3 text-sm">
                <p className="text-mist">{a.title}</p>
                <p className="mt-1 text-xs text-mist-dim">{a.text}</p>
              </li>
            ))}
            {answers.length === 0 && (
              <li className="text-sm text-mist-dim">
                Nothing saved yet. Write an answer once here, reuse it everywhere.
              </li>
            )}
          </ul>
          <div className="flex flex-col gap-2">
            <input
              value={newAnswerTitle}
              onChange={(e) => setNewAnswerTitle(e.target.value)}
              placeholder="Title — e.g. Community essay hook"
              className="min-h-11 rounded-sm border border-ink-line bg-transparent px-3 text-sm text-mist"
            />
            <textarea
              value={newAnswerText}
              onChange={(e) => setNewAnswerText(e.target.value)}
              placeholder="The answer, in your words."
              className="min-h-16 rounded-sm border border-ink-line bg-transparent p-2 text-sm text-mist"
            />
            <button
              disabled={!newAnswerTitle || !newAnswerText}
              onClick={() => {
                addAnswer(newAnswerTitle, newAnswerText);
                setNewAnswerTitle("");
                setNewAnswerText("");
              }}
              className="min-h-11 rounded-sm border border-ink-line px-4 text-sm text-mist hover:border-bloom-deep hover:text-bloom disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save to bank
            </button>
          </div>
        </section>

        <button
          onClick={() => {
            setActivity({ phase: "idle", label: "Aster is resting" });
            onClose();
          }}
          className="sr-only"
        >
          Close
        </button>
      </aside>
    </div>
  );
}
