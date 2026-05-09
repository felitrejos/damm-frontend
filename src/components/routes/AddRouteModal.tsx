"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconCalendar } from "@tabler/icons-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ShinyText } from "@/components/ui/shiny-text";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { WanderingEyes } from "@/components/ui/wandering-eyes";
import { cn } from "@/lib/utils";

import { RouteReviewPanel } from "./RouteReviewPanel";
import {
  generateSuggestedRoutes,
  type SuggestedRoute,
} from "./suggested-routes-mock";

const formSchema = z.object({
  date: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centerId: number;
};

const today = () => new Date().toISOString().slice(0, 10);

const isoToDate = (iso: string): Date | undefined => {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
const dateToIso = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const formatDate = (iso: string): string => {
  const d = isoToDate(iso);
  return d
    ? d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Pick a date";
};

type Phase = "form" | "loading" | "review";

const LOADING_MS = 5000;

export function AddRouteModal({ open, onOpenChange, centerId }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: today() },
  });

  const [phase, setPhase] = React.useState<Phase>("form");
  const [suggestions, setSuggestions] = React.useState<SuggestedRoute[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const reset = React.useCallback(() => {
    form.reset({ date: today() });
    setPhase("form");
    setSuggestions([]);
    setActiveId(null);
  }, [form]);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleGenerate = form.handleSubmit((data) => {
    setPhase("loading");
    window.setTimeout(() => {
      const routes = generateSuggestedRoutes(data.date);
      setSuggestions(routes);
      setActiveId(routes[0]?.transport_id ?? null);
      setPhase("review");
    }, LOADING_MS);
  });

  const handleDone = () => {
    // No endpoint yet — every suggestion is added eventually, so log the
    // whole batch and close.
    // eslint-disable-next-line no-console
    console.log("[AddRouteModal] done — adding all suggestions:", {
      centerId,
      routes: suggestions,
    });
    handleOpenChange(false);
  };

  const active = suggestions.find((s) => s.transport_id === activeId) ?? null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0",
          // Smooth size transition between phases — width + min-height tween
          // on a cubic-bezier so the form → review jump is not abrupt.
          "transition-[max-width,min-height] duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
          phase === "review"
            ? "min-h-[620px] sm:max-w-[1200px]"
            : "min-h-[360px] sm:max-w-[600px]",
        )}
      >
        {phase === "form" ? (
          <FormPhase
            form={form}
            onSubmit={handleGenerate}
            onCancel={() => handleOpenChange(false)}
          />
        ) : null}

        {phase === "loading" ? <LoadingPhase /> : null}

        {phase === "review" && active ? (
          <ReviewPhase
            suggestions={suggestions}
            active={active}
            activeId={activeId}
            onSelect={setActiveId}
            onDone={handleDone}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function FormPhase({
  form,
  onSubmit,
  onCancel,
}: {
  form: ReturnType<typeof useForm<FormData>>;
  onSubmit: (e: React.BaseSyntheticEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <DialogTitle className="text-xl">Add route</DialogTitle>
        <DialogDescription className="max-w-sm">
          Pick a date to generate suggestions.
        </DialogDescription>
      </div>

      <div className="grid w-full max-w-[260px] gap-1.5">
        <Label htmlFor="date" className="text-center">
          Date
        </Label>
        <Controller
          control={form.control}
          name="date"
          render={({ field }) => (
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    id="date"
                    type="button"
                    variant="outline"
                    className="w-full justify-start border-transparent bg-accent font-normal text-foreground hover:bg-accent/80 dark:border-transparent dark:bg-accent dark:hover:bg-accent/80"
                  />
                }
              >
                <IconCalendar className="mr-2 size-4 opacity-60" />
                {formatDate(field.value)}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={isoToDate(field.value)}
                  onSelect={(d) => {
                    if (d) field.onChange(dateToIso(d));
                  }}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {form.formState.errors.date ? (
          <p className="text-center text-[12px] text-destructive">
            {form.formState.errors.date.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <button
          type="submit"
          className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-white px-3 text-[12px] font-medium text-[#111111] ring-1 ring-foreground/10 transition-colors hover:bg-white/90 disabled:opacity-50"
          title="Generate routes"
        >
          <ShinyText
            className="font-medium"
            color="#111111"
            shineColor="#9ca3af"
            speed={5}
            spread={120}
            text="✨ Generate Routes"
          />
        </button>
      </div>
    </form>
  );
}

function LoadingPhase() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10">
      <DialogTitle className="sr-only">Add route</DialogTitle>
      <DialogDescription className="sr-only">
        Generating route suggestions
      </DialogDescription>
      <WanderingEyes
        className="text-foreground"
        style={{ width: 120, height: 120 / (9 / 4) }}
      />
      <TextShimmer className="text-sm" duration={1.6}>
        Generating routes...
      </TextShimmer>
    </div>
  );
}

function ReviewPhase({
  suggestions,
  active,
  activeId,
  onSelect,
  onDone,
}: {
  suggestions: SuggestedRoute[];
  active: SuggestedRoute;
  activeId: string | null;
  onSelect: (id: string) => void;
  onDone: () => void;
}) {
  return (
    <div className="grid grid-cols-[270px_1fr]">
      <aside className="m-2 flex flex-col overflow-hidden rounded-xl border bg-canvas/60">
        <div className="px-4 py-3">
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Suggested
          </div>
          <div className="text-sm font-medium">
            {suggestions.length} route{suggestions.length === 1 ? "" : "s"}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggestions.map((s) => {
            const isActive = s.transport_id === activeId;
            return (
              <li key={s.transport_id}>
                <button
                  type="button"
                  onClick={() => onSelect(s.transport_id)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left transition-colors",
                    isActive
                      ? "border-ring bg-accent"
                      : "border-transparent hover:bg-muted",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-[13px] font-medium">
                      {s.route_code}
                    </div>
                    <div className="text-[11px] tabular-nums text-muted-foreground">
                      {s.total_stops} stops
                    </div>
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {s.driver_name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {s.truck_code} · {s.truck_type}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="flex min-w-0 flex-col">
        <div className="flex flex-col gap-1 px-4 py-3">
          <DialogTitle>Suggested routes — {active.route_code}</DialogTitle>
          <DialogDescription className="sr-only">
            Review the suggested routes — all of them will be added when you
            click Done.
          </DialogDescription>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            <span>
              <span className="text-muted-foreground/70">Driver:</span>{" "}
              <span className="text-foreground">{active.driver_name}</span>
            </span>
            <span>
              <span className="text-muted-foreground/70">Truck:</span>{" "}
              <span className="text-foreground">{active.truck_code}</span>
              <span> · {active.truck_type}</span>
            </span>
            <span>
              <span className="text-muted-foreground/70">Date:</span>{" "}
              <span className="text-foreground tabular-nums">
                {active.date}
              </span>
            </span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <RouteReviewPanel route={active} />
        </div>

        <div className="mt-auto flex justify-end border-t bg-muted/50 p-4">
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
