"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface-2 p-1 text-ink-subtle",
        className,
      )}
      {...props}
    />
  );
}

function TabsTab({
  className,
  ...props
}: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition-colors outline-none select-none",
        "text-ink-subtle hover:text-ink",
        "data-[selected]:bg-surface-3 data-[selected]:text-ink",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:opacity-80",
        className,
      )}
      {...props}
    />
  );
}

function TabsPanel({
  className,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn("flex-1 min-h-0 outline-none", className)}
      {...props}
    />
  );
}

function TabsIndicator({
  className,
  ...props
}: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn(
        "absolute top-1 left-0 h-7 rounded-md bg-surface-3 transition-[transform,width] duration-200",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTab, TabsPanel, TabsIndicator };
