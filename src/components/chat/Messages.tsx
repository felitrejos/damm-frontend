"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import type { UIMessage } from "ai";

import { Dots } from "@/components/ui/dots";
import { cn } from "@/lib/utils";

const welcomeText =
  "Hey there! I'm your SmartTruck assistant. Ask me anything about what you're looking at, like routes, stops, or suggestions. I'm read only, so I won't change anything for you.";

type MessagesProps = {
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
};

export const Messages = memo(function Messages({ messages, status }: MessagesProps) {
  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")?.id;
  const thinking = status === "submitted" || status === "streaming";
  const lastRole = messages[messages.length - 1]?.role;

  return (
    <div className="flex flex-col gap-3">
      <Bubble role="assistant">
        <Markdown text={welcomeText} inverted />
      </Bubble>
      {messages.map((message) => {
        const isUser = message.role === "user";
        const text = message.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("");
        const showThinking =
          thinking && !isUser && message.id === lastAssistantId && !text;

        return (
          <Bubble key={message.id} role={isUser ? "user" : "assistant"}>
            {showThinking ? (
              <ThinkingDots />
            ) : (
              <Markdown text={text} inverted={!isUser} />
            )}
          </Bubble>
        );
      })}
      {thinking && lastRole === "user" ? (
        <Bubble role="assistant">
          <ThinkingDots />
        </Bubble>
      ) : null}
    </div>
  );
});

function Bubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
          isUser
            ? "bg-neutral-100 text-neutral-900"
            : "bg-neutral-800 text-neutral-100",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Markdown({ text, inverted }: { text: string; inverted?: boolean }) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none prose-p:my-1 prose-li:my-0 prose-ul:my-1 prose-ol:my-1",
        inverted && "prose-invert",
      )}
    >
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}

function ThinkingDots() {
  return <Dots className="h-1.5 w-6 text-current" />;
}
