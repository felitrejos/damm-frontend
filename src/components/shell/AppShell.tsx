"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AUTH_FLAG_KEY } from "@/components/auth/LoginForm";

import { Header } from "./header/Header";
import { Sidebar } from "./sidebar/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [authResolved, setAuthResolved] = useState(false);

  const isLoginRoute = pathname?.startsWith("/login") ?? false;

  // Mock auth gate. Real session/SSO will replace this once a backend
  // contract for `/auth/*` exists in the wiki.
  useEffect(() => {
    if (isLoginRoute) {
      setAuthResolved(true);
      return;
    }
    const flag = window.localStorage.getItem(AUTH_FLAG_KEY);
    if (flag !== "1") {
      router.replace("/login");
      return;
    }
    setAuthResolved(true);
  }, [isLoginRoute, router]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (!authResolved) {
    return <div className="h-screen bg-canvas" aria-hidden />;
  }

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
