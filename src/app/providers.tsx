"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { StoreProvider } from "@/lib/store";

// The agentic runtime runs self-hosted at /api/copilotkit. It only boots when
// NEXT_PUBLIC_ASTER_AGENT=on (set when OPENAI_API_KEY is configured at deploy).
// Without it the workspace still works fully — the header status chip explains
// why the agent is quiet.
export function Providers({ children }: { children: React.ReactNode }) {
  const agentOn = process.env.NEXT_PUBLIC_ASTER_AGENT === "on";

  const core = agentOn ? (
    <CopilotKit runtimeUrl="/api/copilotkit">{children}</CopilotKit>
  ) : (
    <>{children}</>
  );

  return <StoreProvider>{core}</StoreProvider>;
}
