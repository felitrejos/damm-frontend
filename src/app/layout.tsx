import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import { BreadcrumbProvider } from "@/components/shell/breadcrumb";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SmartTruck Planner",
  description: "Damm/DDI route and load optimization planner",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("dark", geist.variable, jetbrainsMono.variable)}>
      <body className="min-h-screen antialiased">
        <BreadcrumbProvider>
          <AppShell>{children}</AppShell>
        </BreadcrumbProvider>
      </body>
    </html>
  );
}
