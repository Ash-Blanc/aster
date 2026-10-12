"use client";

import {
  useCopilotAction,
  useCopilotReadable,
} from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useStore } from "@/lib/store";
import type { Outline, Station } from "@/lib/types";

type Beat = { beat: string; detail: string };
type DraftArgs = { stationId: string; promptId: string; beats: Beat[] };

const GUARDRAIL =
  "Outlines and hooks only. You NEVER write essay prose — that work belongs to the student.";

function stationBrief(stations: Station[]) {
  return stations
    .map((s) => {
      const prompts = s.prompts.length
        ? s.prompts
            .map(
              (p) =>
                `      - prompt ${p.id}: "${p.text}" (${p.words} words)${
                  p.outline?.length ? ` — ${p.outline.length} beats outlined` : ""
                }${p.notes ? ` — notes: ${p.notes}` : ""}`
            )
            .join("\n")
        : "      - (no prompts yet)";
      return `- station ${s.id}: "${s.name}" (${s.kind}, ${s.status}, due ${s.due})\n${prompts}`;
    })
    .join("\n");
}

export function AsterAgent() {
  const {
    stations,
    answers,
    addOutline,
    setActivity,
    addStation,
    attachPrompts,
    attachAnswerToPrompt,
  } = useStore();

  useCopilotReadable({
    description:
      "Every application station on the rail: id, name, kind, status, due date, and its essay prompts with their ids, word counts, outlines and notes. Use these ids in actions.",
    value: stationBrief(stations),
  });

  useCopilotReadable({
    description:
      "The answer bank: reusable past answers the student wrote once. Ids and titles. Use with reuse_answer.",
    value:
      answers.map((a) => `- answer ${a.id}: "${a.title}": ${a.text}`).join("\n") ||
      "(empty — no reusable answers yet)",
  });

  // --- add_application -------------------------------------------------
  useCopilotAction({
    name: "add_application",
    description: `Add a new application station to the rail. ${GUARDRAIL} kind must be one of: hackathon, college, scholarship, olympiad. due is an ISO date (YYYY-MM-DD).`,
    parameters: [
      { name: "name", type: "string", required: true, description: "Name of the application or competition." },
      {
        name: "kind",
        type: "string",
        required: true,
        enum: ["hackathon", "college", "scholarship", "olympiad"],
      },
      { name: "due", type: "string", required: true, description: "Deadline, ISO date YYYY-MM-DD." },
    ],
    renderAndWait: (props) => {
      const { name, kind, due } = props.args as { name?: string; kind?: Station["kind"]; due?: string };
      const committing = props.status === "executing" && name && due;

      const commit = (accepted: boolean) => {
        if (accepted && name && kind && due) addStation({ name, kind, due });
        setActivity({ phase: "idle", label: "Aster is resting" });
        props.respond?.(accepted ? "accepted" : "dismissed");
      };

      return (
        <div className="rounded-md border border-ink-line bg-ink-raised p-4 text-sm">
          <p className="font-display text-lg text-mist">New station</p>
          {name ? (
            <p className="mt-1 text-mist-dim">
              <span className="text-mist">{name}</span> · {kind ?? "…"} · due {due ?? "…"}
            </p>
          ) : (
            <p className="mt-1 text-mist-dim">Working out the details…</p>
          )}
          {committing ? (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => commit(true)}
                className="min-h-11 rounded-sm bg-bloom px-4 font-medium text-ink"
              >
                Add to rail
              </button>
              <button
                onClick={() => commit(false)}
                className="min-h-11 rounded-sm border border-ink-line px-4 text-mist"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-mist-dim">Nothing changes until you say so.</p>
          )}
        </div>
      );
    },
  });

  // --- fetch_prompts ---------------------------------------------------
  useCopilotAction({
    name: "fetch_prompts",
    description:
      "Attach essay prompts to a station. Use for stations with no prompts yet. words is the required word count.",
    parameters: [
      { name: "stationId", type: "string", required: true },
      {
        name: "prompts",
        type: "object[]",
        required: true,
        description: "The prompts to attach.",
        attributes: [
          { name: "text", type: "string", required: true },
          { name: "words", type: "number", required: true },
        ],
      },
    ],
    renderAndWait: (props) => {
      const { stationId, prompts } = props.args as {
        stationId?: string;
        prompts?: { text: string; words: number }[];
      };
      const station = stations.find((s) => s.id === stationId);
      const list = prompts ?? [];
      const ready = props.status === "executing" && stationId && list.length > 0;

      const commit = (accepted: boolean) => {
        if (accepted && stationId) attachPrompts(stationId, list);
        setActivity({ phase: "idle", label: "Aster is resting" });
        props.respond?.(accepted ? "accepted" : "dismissed");
      };

      return (
        <div className="rounded-md border border-ink-line bg-ink-raised p-4 text-sm">
          <p className="font-display text-lg text-mist">
            Prompts for {station?.name ?? "station"}
          </p>
          <ul className="mt-2 space-y-1 text-mist-dim">
            {list.length > 0 ? (
              list.map((p, i) => (
                <li key={i}>
                  <span className="text-mist">“{p.text}”</span> — {p.words} words
                </li>
              ))
            ) : (
              <li>Looking them up…</li>
            )}
          </ul>
          {ready ? (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => commit(true)}
                className="min-h-11 rounded-sm bg-bloom px-4 font-medium text-ink"
              >
                Attach prompts
              </button>
              <button
                onClick={() => commit(false)}
                className="min-h-11 rounded-sm border border-ink-line px-4 text-mist"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-mist-dim">Nothing changes until you say so.</p>
          )}
        </div>
      );
    },
  });

  // --- draft_outline ---------------------------------------------------
  useCopilotAction({
    name: "draft_outline",
    description: `Propose an outline of beats for an essay prompt. ${GUARDRAIL} beats is an ordered list; beat is a one-line heading, detail is guidance for the student.`,
    parameters: [
      { name: "stationId", type: "string", required: true, description: "The application station id." },
      { name: "promptId", type: "string", required: true, description: "The essay prompt id." },
      {
        name: "beats",
        type: "object[]",
        required: true,
        description: "Ordered outline beats.",
        attributes: [
          { name: "beat", type: "string", required: true },
          { name: "detail", type: "string", required: true },
        ],
      },
    ],
    renderAndWait: (props) => {
      const args = props.args as Partial<DraftArgs>;
      const beats = args.beats ?? [];
      const station = stations.find((s) => s.id === args.stationId);
      const ready = props.status === "executing" && args.stationId && args.promptId && beats.length > 0;

      const commit = (accepted: boolean) => {
        if (accepted && args.stationId && args.promptId) {
          addOutline(
            args.stationId,
            args.promptId,
            beats.map((b, i) => ({ id: `${args.promptId}-o${i}`, beat: b.beat, detail: b.detail }) as Outline)
          );
        }
        setActivity({ phase: "idle", label: "Aster is resting" });
        props.respond?.(accepted ? "accepted" : "dismissed");
      };

      return (
        <div className="rounded-md border border-ink-line bg-ink-raised p-4 text-sm">
          <p className="font-display text-lg text-mist">
            Proposed outline{station ? ` — ${station.name}` : ""}
          </p>
          {beats.length > 0 ? (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-mist-dim">
              {beats.map((b, i) => (
                <li key={i}>
                  <span className="text-mist">{b.beat}</span> — {b.detail}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-mist-dim">Aster is sketching beats…</p>
          )}
          {ready ? (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => commit(true)}
                className="min-h-11 rounded-sm bg-bloom px-4 font-medium text-ink"
              >
                Add to plan
              </button>
              <button
                onClick={() => commit(false)}
                className="min-h-11 rounded-sm border border-ink-line px-4 text-mist"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-mist-dim">Outlines only. The words are yours.</p>
          )}
        </div>
      );
    },
  });

  // --- reuse_answer ----------------------------------------------------
  useCopilotAction({
    name: "reuse_answer",
    description:
      "Attach a saved answer from the answer bank to a prompt as reference notes. The student reuses their own words — never new prose.",
    parameters: [
      { name: "stationId", type: "string", required: true },
      { name: "promptId", type: "string", required: true },
      { name: "answerId", type: "string", required: true, description: "An id from the answer bank." },
    ],
    renderAndWait: (props) => {
      const { stationId, promptId, answerId } = props.args as {
        stationId?: string;
        promptId?: string;
        answerId?: string;
      };
      const station = stations.find((s) => s.id === stationId);
      const answer = answers.find((a) => a.id === answerId);
      const ready = props.status === "executing" && stationId && promptId && answerId;

      const commit = (accepted: boolean) => {
        if (accepted && stationId && promptId && answerId) {
          attachAnswerToPrompt(stationId, promptId, answerId);
        }
        setActivity({ phase: "idle", label: "Aster is resting" });
        props.respond?.(accepted ? "accepted" : "dismissed");
      };

      return (
        <div className="rounded-md border border-ink-line bg-ink-raised p-4 text-sm">
          <p className="font-display text-lg text-mist">Reuse answer</p>
          {answer ? (
            <p className="mt-1 text-mist-dim">
              “{answer.title}” → {station?.name ?? "station"}
            </p>
          ) : (
            <p className="mt-1 text-mist-dim">Finding it in the bank…</p>
          )}
          {ready ? (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => commit(true)}
                className="min-h-11 rounded-sm bg-bloom px-4 font-medium text-ink"
              >
                Attach as reference
              </button>
              <button
                onClick={() => commit(false)}
                className="min-h-11 rounded-sm border border-ink-line px-4 text-mist"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-mist-dim">Your words, reattached. Nothing written for you.</p>
          )}
        </div>
      );
    },
  });

  return (
    <CopilotSidebar
      labels={{ title: "Aster", initial: "What are we applying to next?" }}
      defaultOpen={false}
    />
  );
}
