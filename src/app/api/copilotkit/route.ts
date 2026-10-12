import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

const modelConfigured = Boolean(process.env.OPENAI_API_KEY);

if (!modelConfigured) {
  // eslint-disable-next-line no-console
  console.warn("OPENAI_API_KEY is not set. The Aster copilot will be unable to respond.");
}

const runtime = new CopilotRuntime();

export async function GET() {
  return Response.json({ ok: true, modelConfigured });
}

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new OpenAIAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
