"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";

const STORAGE_KEY = "damm.smarttruck.chat";
const MAX_PERSISTED_MESSAGES = 60;

type ChatHelpers = ReturnType<typeof useChat>;

const Ctx = createContext<ChatHelpers | null>(null);

function readStored(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as UIMessage[];
  } catch {
    return [];
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const helpers = useChat({ experimental_throttle: 80 });
  const hydratedRef = useRef(false);

  // Hydrate once from localStorage. setMessages bypasses the API, so we don't
  // re-trigger the model.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const stored = readStored();
    if (stored.length > 0) {
      helpers.setMessages(stored);
    }
  }, [helpers]);

  // Save on every message change after hydration. Cap to avoid unbounded
  // localStorage growth — older turns drop off the front.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (typeof window === "undefined") return;
    try {
      const trimmed = helpers.messages.slice(-MAX_PERSISTED_MESSAGES);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Quota exceeded or serialization failed — drop silently. The chat
      // still works in-session; only persistence is lost.
    }
  }, [helpers.messages]);

  return <Ctx.Provider value={helpers}>{children}</Ctx.Provider>;
}

export function useChatHelpers(): ChatHelpers {
  const value = useContext(Ctx);
  if (!value) {
    throw new Error("useChatHelpers must be used inside ChatProvider");
  }
  return value;
}

export function clearStoredChat() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
