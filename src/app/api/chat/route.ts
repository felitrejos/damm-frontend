import { streamText, type UIMessage } from "ai";

import { buildSystemPrompt, plannerModel, plannerTemperature } from "@/agents/planner";
import { buildVisibleChatContext } from "@/agents/visible-context";
import { parseChatContext } from "@/lib/chat/context";
import { toCoreMessages } from "@/lib/chat/message-converters";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const messages = Array.isArray(body?.messages)
    ? (body.messages as UIMessage[])
    : [];
  const ctx = parseChatContext(body?.context);
  const modelMessages = toCoreMessages(messages);

  if (modelMessages.length === 0) {
    return new Response("Missing messages.", { status: 400 });
  }

  try {
    const visible = await buildVisibleChatContext(ctx);
    const result = streamText({
      model: plannerModel,
      system: buildSystemPrompt(visible?.prompt),
      messages: modelMessages,
      temperature: plannerTemperature,
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[/api/chat] planner run failed", error);
    return new Response("Chat request failed. Please try again.", {
      status: 500,
    });
  }
}
