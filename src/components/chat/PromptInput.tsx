"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowUp, IconEye, IconPlayerStopFilled } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

type PromptInputProps = {
  busy: boolean;
  contextLabel: string;
  onSubmit: (text: string) => void;
  onStop: () => void;
  autoFocus?: boolean;
};

export function PromptInput({
  busy,
  contextLabel,
  onSubmit,
  onStop,
  autoFocus,
}: PromptInputProps) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    onSubmit(trimmed);
    setText("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="rounded-xl border border-neutral-800 bg-neutral-900 p-2"
    >
      <div className="mb-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-neutral-300">
        <IconEye className="size-3.5 shrink-0" aria-hidden />
        <span className="shrink-0 text-neutral-500">Seeing</span>
        <span className="truncate text-neutral-100">{contextLabel}</span>
      </div>
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          rows={1}
          placeholder={busy ? "Waiting for response..." : "Ask something..."}
          className="max-h-32 flex-1 resize-none bg-transparent px-1 py-[3px] text-[13px] leading-[1.45] text-neutral-100 outline-none placeholder:text-neutral-500"
          value={text}
          onChange={(e) => {
            setText(e.currentTarget.value);
            autoResize(e.currentTarget);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          type={busy ? "button" : "submit"}
          onClick={busy ? onStop : undefined}
          disabled={!busy && text.trim().length === 0}
          aria-label={busy ? "Stop response" : "Send message"}
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
            busy
              ? "bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
              : "bg-neutral-100 text-neutral-900 hover:bg-white disabled:opacity-40",
          )}
        >
          {busy ? (
            <IconPlayerStopFilled className="size-3.5" />
          ) : (
            <IconArrowUp className="size-4" />
          )}
        </button>
      </div>
    </form>
  );
}
