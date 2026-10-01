import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, AGENT_SYSTEM } from "../../../lib/agentTools";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.AGENT_MODEL || "claude-opus-5-5";

export async function POST(req: Request) {
  if (process.env.AGENT_MOCK === "1") {
    return Response.json(mockTurn(await safeBody(req)));
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error:
          "The assistant isn't configured yet. Add ANTHROPIC_API_KEY to the deployment to enable it.",
      },
      { status: 503 }
    );
  }

  let body: AgentBody;
  try {
    body = (await req.json()) as AgentBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!Array.isArray(body.messages)) {
    return Response.json({ error: "messages[] required." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const system = `${AGENT_SYSTEM}\n\nToday's date: ${today}.\n\nCurrent garage snapshot:\n${
    body.context || "(none provided)"
  }`;

  const client = new Anthropic();
  const encoder = new TextEncoder();
  const sse = (event: string, data: unknown) =>
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const run = client.messages.stream({
          model: MODEL,
          max_tokens: 2048,
          output_config: { effort: "low" },
          system,
          tools: AGENT_TOOLS as unknown as Anthropic.Tool[],
          messages: body.messages as Anthropic.MessageParam[],
        });

        for await (const event of run) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(sse("delta", { text: event.delta.text }));
          }
        }

        const final = await run.finalMessage();
        controller.enqueue(
          sse("final", { content: final.content, stop_reason: final.stop_reason })
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Assistant error.";
        controller.enqueue(sse("error", { message }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

interface AgentBody {
  messages: unknown[];
  context?: string;
}

async function safeBody(req: Request): Promise<AgentBody> {
  try {
    return (await req.json()) as AgentBody;
  } catch {
    return { messages: [] };
  }
}

// Deterministic mock for tests (AGENT_MOCK=1): if the last user text mentions an
// oil change, stage a service record; otherwise answer from context.
function mockTurn(body: AgentBody) {
  const msgs = body.messages as Array<{ role: string; content: unknown }>;
  const last = [...msgs].reverse().find((m) => m.role === "user");
  const text =
    typeof last?.content === "string"
      ? last.content
      : Array.isArray(last?.content)
      ? (last!.content as Array<{ type: string; text?: string }>)
          .map((b) => (b.type === "text" ? b.text || "" : ""))
          .join(" ")
      : "";

  // If the previous assistant turn already made a tool call, this is the
  // post-tool_result turn — reply with final text.
  const hadToolUse = msgs.some(
    (m) =>
      m.role === "assistant" &&
      Array.isArray(m.content) &&
      (m.content as Array<{ type: string }>).some((b) => b.type === "tool_use")
  );
  if (hadToolUse) {
    return {
      content: [
        {
          type: "text",
          text: "Done — I've prepared that. Tap Apply to confirm it in your garage.",
        },
      ],
      stop_reason: "end_turn",
    };
  }

  if (/oil change/i.test(text)) {
    return {
      content: [
        { type: "text", text: "Got it — logging your oil change." },
        {
          type: "tool_use",
          id: "toolu_mock_1",
          name: "add_service_record",
          input: {
            title: "Engine oil & filter change",
            performed_by: "diy",
            cost_usd: 60,
          },
        },
      ],
      stop_reason: "tool_use",
    };
  }

  return {
    content: [
      {
        type: "text",
        text: "I can log service, track pending repairs, update your vehicle, and more. What would you like to do?",
      },
    ],
    stop_reason: "end_turn",
  };
}
