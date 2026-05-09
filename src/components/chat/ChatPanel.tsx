"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { contextLabelFor } from "@/lib/chat/context";
import type { PlannerChatContext } from "@/lib/chat/types";

import { useChatHelpers } from "./ChatProvider";
import { Messages } from "./Messages";
import { PromptInput } from "./PromptInput";
import { useChatSurfaceState } from "./ChatSurfaceProvider";

export function ChatPanel() {
  const { context } = useChatSurfaceState();
  const contextRef = useRef<PlannerChatContext | null>(context);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const { messages, sendMessage, status, stop } = useChatHelpers();

  const label = useMemo(() => contextLabelFor(context ?? undefined), [context]);

  const handleSubmit = useCallback(
    (text: string) => {
      void sendMessage(
        { text },
        { body: { context: contextRef.current } },
      );
    },
    [sendMessage],
  );

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    if (!stickToBottom.current) return;
    const node = scrollRef.current;
    if (!node) return;
    const frame = window.requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-[inherit]">
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const node = e.currentTarget;
          stickToBottom.current =
            node.scrollHeight - node.scrollTop - node.clientHeight < 48;
        }}
        className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-2 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Messages messages={messages} status={status} />
      </div>
      <div className="shrink-0 px-3 pb-3">
        <PromptInput
          autoFocus
          busy={busy}
          contextLabel={label}
          onSubmit={handleSubmit}
          onStop={stop}
        />
      </div>
    </div>
  );
}
