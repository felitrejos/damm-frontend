"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import MetallicPaint from "@/components/ui/metallic-paint";
import { cn } from "@/lib/utils";

import { ChatPanel } from "./ChatPanel";

const cardShadow =
  "shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]";
const expandedShadow =
  "shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.05)]";

const COLLAPSED = { width: 56, height: 56, borderRadius: 28 };
const EXPANDED = { width: 420, height: 540, borderRadius: 16 };

const morphEase = [0.32, 0.72, 0, 1] as const;

export function AgentBubble() {
  const [expanded, setExpanded] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!expanded) return;
    function onMouseDown(e: MouseEvent) {
      if (shellRef.current?.contains(e.target as Node)) return;
      setExpanded(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-0 z-[55] bg-black/35 backdrop-blur-[1px] transition-opacity duration-300",
          expanded ? "opacity-100" : "opacity-0",
        )}
      />
      <motion.div
        ref={shellRef}
        animate={expanded ? EXPANDED : COLLAPSED}
        initial={COLLAPSED}
        whileHover={expanded ? undefined : { scale: 1.08, y: -2 }}
        whileTap={expanded ? undefined : { scale: 0.96 }}
        transition={{
          width: { duration: 0.55, ease: morphEase },
          height: { duration: 0.55, ease: morphEase },
          borderRadius: { duration: 0.22, ease: "easeOut" },
          scale: { type: "spring", stiffness: 380, damping: 22 },
          y: { type: "spring", stiffness: 380, damping: 22 },
        }}
        style={{ transformOrigin: "bottom right" }}
        className={cn(
          "fixed bottom-6 right-6 z-[60] overflow-hidden border border-neutral-800 bg-neutral-950 text-neutral-100 backdrop-blur",
          "will-change-[width,height,border-radius,transform]",
          expanded ? expandedShadow : cardShadow,
        )}
      >
        {expanded ? (
          <ChatPanel />
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Ask SmartTruck"
            className="flex h-full w-full items-center justify-center"
          >
            <div className="size-9">
              <MetallicPaint
                imageSrc="/damm-d-mark.svg"
                seed={42}
                scale={4}
                speed={0.35}
                liquid={0.75}
                brightness={2}
                contrast={0.5}
                refraction={0.01}
                blur={0.015}
                chromaticSpread={2}
                fresnel={1}
                patternSharpness={1}
                waveAmplitude={1}
                noiseScale={0.5}
                distortion={1}
                contour={0.2}
                lightColor="#ffffff"
                darkColor="#000000"
                tintColor="#feb3ff"
              />
            </div>
          </button>
        )}
      </motion.div>
    </>
  );
}
