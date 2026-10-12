"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AgentActivity, Answer, Outline, Prompt, Station } from "./types";

const STORAGE_KEY = "aster:state:v1";

const seed: Station[] = [
  {
    id: "hb-oct",
    name: "Hyperbloom October",
    kind: "hackathon",
    due: "2026-10-20",
    status: "drafting",
    prompts: [
      {
        id: "hb-oct-p1",
        text: "Describe a design decision you made and the problem it solved.",
        words: 300,
      },
    ],
  },
  {
    id: "cml-sch",
    name: "Columbia Scholarship",
    kind: "scholarship",
    due: "2026-11-01",
    status: "planned",
    prompts: [
      {
        id: "cml-sch-p1",
        text: "What does community mean to you?",
        words: 250,
      },
    ],
  },
  {
    id: "y2fell",
    name: "Y2 Labs Fellowship",
    kind: "hackathon",
    due: "2026-10-28",
    status: "planned",
    prompts: [],
  },
  {
    id: "ioai",
    name: "IOAI",
    kind: "olympiad",
    due: "2026-10-18",
    status: "drafting",
    prompts: [
      {
        id: "ioai-p1",
        text: "Describe an AI project you built and the problem it solved.",
        words: 300,
      },
    ],
  },
  {
    id: "mitit",
    name: "MITIT (MIT Integration Tournament)",
    kind: "olympiad",
    url: "https://mitit.org",
    due: "2026-10-24",
    status: "planned",
    prompts: [],
  },
  {
    id: "ioi",
    name: "IOI — national team selection",
    kind: "olympiad",
    due: "2026-11-02",
    status: "planned",
    prompts: [],
  },
  {
    id: "egoi",
    name: "EGOI (European Girls' Olympiad in Informatics)",
    kind: "olympiad",
    due: "2026-11-08",
    status: "planned",
    prompts: [],
  },
  {
    id: "algoqueen",
    name: "ICPC AlgoQueen",
    kind: "olympiad",
    due: "2026-11-15",
    status: "planned",
    prompts: [],
  },
  {
    id: "ilo",
    name: "ILO — International Linguistics Olympiad",
    kind: "olympiad",
    due: "2026-11-20",
    status: "planned",
    prompts: [
      {
        id: "ilo-p1",
        text: "What draws you to the structure of language?",
        words: 250,
      },
    ],
  },
  {
    id: "imo",
    name: "IMO — national team selection",
    kind: "olympiad",
    due: "2026-12-01",
    status: "planned",
    prompts: [],
  },
];

const seedAnswers: Answer[] = [
  {
    id: "ans-community",
    title: "Community — robotics club story",
    text: "Rebuilding the robotics club's parts inventory after the storeroom flood, and what teaching juniors to solder taught me about patience.",
  },
];

type AppState = { stations: Station[]; answers: Answer[] };

type Store = {
  stations: Station[];
  answers: Answer[];
  activity: AgentActivity;
  loaded: boolean;
  submitStation: (id: string) => void;
  addOutline: (stationId: string, promptId: string, outline: Outline[]) => void;
  setActivity: (a: AgentActivity) => void;
  addStation: (s: { name: string; kind: Station["kind"]; due: string; url?: string }) => string;
  attachPrompts: (stationId: string, prompts: { text: string; words: number }[]) => void;
  updatePromptNotes: (stationId: string, promptId: string, notes: string) => void;
  renameOutlineBeat: (stationId: string, promptId: string, outlineId: string, beat: string) => void;
  deleteOutlineBeat: (stationId: string, promptId: string, outlineId: string) => void;
  addAnswer: (title: string, text: string) => string;
  updateAnswer: (id: string, title: string, text: string) => void;
  deleteAnswer: (id: string) => void;
  attachAnswerToPrompt: (stationId: string, promptId: string, answerId: string) => void;
  resetDemo: () => void;
};

const Ctx = createContext<Store | null>(null);

function loadState(): AppState {
  if (typeof window === "undefined") return { stations: seed, answers: seedAnswers };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { stations: seed, answers: seedAnswers };
    const parsed = JSON.parse(raw) as AppState;
    if (!Array.isArray(parsed.stations)) return { stations: seed, answers: seedAnswers };
    return { stations: parsed.stations, answers: parsed.answers ?? seedAnswers };
  } catch {
    return { stations: seed, answers: seedAnswers };
  }
}

let idCounter = 0;
function freshId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({ stations: seed, answers: seedAnswers });
  const [loaded, setLoaded] = useState(false);
  const [activity, setActivity] = useState<AgentActivity>({ phase: "idle", label: "Aster is resting" });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setState(loadState());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Storage full or blocked — the session still works in memory.
      }
    }, 300);
  }, [state, loaded]);

  const patchStation = useCallback((id: string, fn: (s: Station) => Station) => {
    setState((prev) => ({
      ...prev,
      stations: prev.stations.map((s) => (s.id === id ? fn(s) : s)),
    }));
  }, []);

  const patchPrompt = useCallback(
    (stationId: string, promptId: string, fn: (p: Prompt) => Prompt) => {
      patchStation(stationId, (s) => ({
        ...s,
        prompts: s.prompts.map((p) => (p.id === promptId ? fn(p) : p)),
      }));
    },
    [patchStation]
  );

  const submitStation = useCallback(
    (id: string) => patchStation(id, (s) => ({ ...s, status: "submitted" })),
    [patchStation]
  );

  const addOutline = useCallback(
    (stationId: string, promptId: string, outline: Outline[]) => {
      patchPrompt(stationId, promptId, (p) => ({ ...p, outline }));
    },
    [patchPrompt]
  );

  const addStation = useCallback<Store["addStation"]>((input) => {
    const id = freshId("st");
    setState((prev) => ({
      ...prev,
      stations: [
        ...prev.stations,
        { id, name: input.name, kind: input.kind, due: input.due, url: input.url, status: "planned", prompts: [] },
      ],
    }));
    return id;
  }, []);

  const attachPrompts = useCallback<Store["attachPrompts"]>(
    (stationId, prompts) => {
      patchStation(stationId, (s) => ({
        ...s,
        prompts: [
          ...s.prompts,
          ...prompts.map((p) => ({ id: freshId("pr"), text: p.text, words: p.words })),
        ],
      }));
    },
    [patchStation]
  );

  const updatePromptNotes = useCallback<Store["updatePromptNotes"]>(
    (stationId, promptId, notes) => patchPrompt(stationId, promptId, (p) => ({ ...p, notes })),
    [patchPrompt]
  );

  const renameOutlineBeat = useCallback<Store["renameOutlineBeat"]>(
    (stationId, promptId, outlineId, beat) =>
      patchPrompt(stationId, promptId, (p) => ({
        ...p,
        outline: p.outline?.map((o) => (o.id === outlineId ? { ...o, beat } : o)),
      })),
    [patchPrompt]
  );

  const deleteOutlineBeat = useCallback<Store["deleteOutlineBeat"]>(
    (stationId, promptId, outlineId) =>
      patchPrompt(stationId, promptId, (p) => ({
        ...p,
        outline: p.outline?.filter((o) => o.id !== outlineId),
      })),
    [patchPrompt]
  );

  const addAnswer = useCallback<Store["addAnswer"]>((title, text) => {
    const id = freshId("ans");
    setState((prev) => ({ ...prev, answers: [...prev.answers, { id, title, text }] }));
    return id;
  }, []);

  const updateAnswer = useCallback<Store["updateAnswer"]>((id, title, text) => {
    setState((prev) => ({
      ...prev,
      answers: prev.answers.map((a) => (a.id === id ? { ...a, title, text } : a)),
    }));
  }, []);

  const deleteAnswer = useCallback<Store["deleteAnswer"]>((id) => {
    setState((prev) => ({ ...prev, answers: prev.answers.filter((a) => a.id !== id) }));
  }, []);

  const attachAnswerToPrompt = useCallback<Store["attachAnswerToPrompt"]>(
    (stationId, promptId, answerId) => {
      const answer = state.answers.find((a) => a.id === answerId);
      if (!answer) return;
      patchPrompt(stationId, promptId, (p) => ({
        ...p,
        notes: `Reference — "${answer.title}": ${answer.text}`,
      }));
    },
    [patchPrompt, state.answers]
  );

  const resetDemo = useCallback(() => {
    setState({ stations: seed, answers: seedAnswers });
  }, []);

  const value = useMemo<Store>(
    () => ({
      stations: state.stations,
      answers: state.answers,
      activity,
      loaded,
      submitStation,
      addOutline,
      setActivity,
      addStation,
      attachPrompts,
      updatePromptNotes,
      renameOutlineBeat,
      deleteOutlineBeat,
      addAnswer,
      updateAnswer,
      deleteAnswer,
      attachAnswerToPrompt,
      resetDemo,
    }),
    [
      state,
      activity,
      loaded,
      submitStation,
      addOutline,
      addStation,
      attachPrompts,
      updatePromptNotes,
      renameOutlineBeat,
      deleteOutlineBeat,
      addAnswer,
      updateAnswer,
      deleteAnswer,
      attachAnswerToPrompt,
      resetDemo,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

export function useDaysLeft(due: string) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const ms = new Date(due + "T23:59:59").getTime() - Date.now();
    setDays(Math.ceil(ms / 86400000));
  }, [due]);
  return days;
}
