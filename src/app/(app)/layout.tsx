import { AppShell } from "@/components/shell/AppShell";
import { BreadcrumbProvider } from "@/components/shell/breadcrumb";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BreadcrumbProvider>
      <AppShell>{children}</AppShell>
    </BreadcrumbProvider>
  );
}
