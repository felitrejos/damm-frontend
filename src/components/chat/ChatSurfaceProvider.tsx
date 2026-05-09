"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { PlannerChatContext } from "@/lib/chat/types";

type ChatSurfaceState = {
  context: PlannerChatContext | null;
  setContext: (ctx: PlannerChatContext | null) => void;
};

const Ctx = createContext<ChatSurfaceState | null>(null);

export function ChatSurfaceProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<PlannerChatContext | null>(null);
  const value = useMemo(() => ({ context, setContext }), [context]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChatSurfaceState(): ChatSurfaceState {
  const value = useContext(Ctx);
  if (!value) {
    throw new Error("useChatSurfaceState must be used inside ChatSurfaceProvider");
  }
  return value;
}

export function useChatSurface(ctx: PlannerChatContext | null) {
  const { setContext } = useChatSurfaceState();
  const setter = useCallback(
    (next: PlannerChatContext | null) => setContext(next),
    [setContext],
  );
  useEffect(() => {
    setter(ctx);
    return () => setter(null);
    // ctx is reference-fresh per render; consumers should memoize it.
  }, [ctx, setter]);
}
