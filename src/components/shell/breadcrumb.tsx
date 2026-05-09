"use client";

import { createContext, useContext, useState } from "react";

export type Crumb = {
  label: string;
  onClick?: () => void;
};

type BreadcrumbCtx = {
  crumbs: Crumb[];
  setCrumbs: (next: Crumb[]) => void;
};

const BreadcrumbContext = createContext<BreadcrumbCtx | null>(null);

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  return (
    <BreadcrumbContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) {
    throw new Error("useBreadcrumb must be used within <BreadcrumbProvider>");
  }
  return ctx;
}
