import type { UIMessage, ModelMessage } from "ai";

const maxInputMessages = 24;
const maxReplayTextChars = 2_000;

type TextPart = { type: "text"; text: string };

function isTextPart(part: UIMessage["parts"][number]): part is TextPart {
  return part.type === "text";
}

function compactReplayText(value: string): string {
  if (!value.trim()) return "";
  if (value.length <= maxReplayTextChars) return value;
  return `${value.slice(0, maxReplayTextChars)}...[truncated]`;
}

function messageText(message: UIMessage): string {
  const text =
    message.parts
      ?.filter(isTextPart)
      .map((part) => part.text)
      .join("") ?? "";
  return compactReplayText(text).trim();
}

export function toCoreMessages(messages: UIMessage[]): ModelMessage[] {
  const out: ModelMessage[] = [];
  const replay = messages.filter((m) => m.role !== "system").slice(-maxInputMessages);
  for (const message of replay) {
    const text = messageText(message);
    if (!text) continue;
    if (message.role === "assistant") {
      out.push({ role: "assistant", content: text });
    } else {
      out.push({ role: "user", content: text });
    }
  }
  return out;
}
