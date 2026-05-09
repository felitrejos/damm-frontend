"use client";

import { useState } from "react";
import { Header } from "./header/Header";
import { Sidebar } from "./sidebar/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-canvas text-ink">
      <Header
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-col min-h-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
