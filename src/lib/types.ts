export type StationStatus = "planned" | "drafting" | "review" | "submitted";

export type Station = {
  id: string;
  name: string;
  kind: "hackathon" | "college" | "scholarship" | "olympiad";
  url?: string;
  due: string; // ISO date
  status: StationStatus;
  prompts: Prompt[];
};

export type Prompt = {
  id: string;
  text: string;
  words: number;
  outline?: Outline[];
  notes?: string;
};

export type Outline = {
  id: string;
  beat: string;
  detail: string;
};

export type Answer = {
  id: string;
  title: string;
  text: string;
};

export type AgentPhase = "idle" | "thinking" | "acting" | "awaiting";

export type AgentActivity = {
  phase: AgentPhase;
  label: string;
  stationId?: string;
};
