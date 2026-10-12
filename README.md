# Aster

The calm application workspace for high schoolers. One surface for every deadline, prompt, and requirement — with an agent that acts inside the UI: outlines, never essays.

Built for **Hyperbloom October (UI/UX)**.

## The problem

Applications are scattered across Devpost portals, scholarship sites, and college dashboards. Every portal asks the same questions, deadlines live in different places, and "AI help" products either write the essay for you (cheating) or don't help at all.

Aster fixes the shape of the work: applications become stations on a rail, reusable answers live in one place, and the agent researches prompts and proposes outline beats — the student commits every change. Agent proposes, human decides.

## Design ideology (Jobs: design solves the problem)

- **One surface.** No dashboards of dashboards — a single horizontal rail where position means time.
- **One accent.** Candlelight amber appears only on what is *alive*: the next deadline, the agent's pending proposal. If everything glows, nothing does.
- **Motion carries meaning.** Stations enter on a 3-beat rhythm; a station pending the agent glows; reduced-motion is respected, not optional.
- **The agent is a character, not a widget.** Its state (resting, thinking, acting, waiting on you) is in the header, all the time.

## The agentic core (CopilotKit)

Four actions, every one human-in-the-loop via `renderAndWait` — the proposal renders inline and nothing changes until you press the button:

- `add_application` — adds a station to the rail
- `fetch_prompts` — attaches essay prompts to a station
- `draft_outline` — proposes outline beats (never prose — beats and hooks only, enforced in the tool description)
- `reuse_answer` — pulls a saved answer from the answer bank into a prompt's notes as reference

The agent sees the full rail state through `useCopilotReadable` — it picks real station/prompt ids and answers "what's due next" from actual data.

## Persistence

State lives in `localStorage` (`aster:state:v1`) — add a station, commit an outline, reload, it's all still there. "Reset demo" in the footer restores the seed.

## Stack

Next.js 16 · Tailwind v4 · TypeScript · bun · CopilotKit v1.78

## Run

```sh
bun install
bun run dev
```

For the agentic layer, copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` (the client flag `NEXT_PUBLIC_ASTER_AGENT=on` is already in the example). Without it the workspace works fully by hand and the header says the agent is offline.

Deploy: Vercel.
