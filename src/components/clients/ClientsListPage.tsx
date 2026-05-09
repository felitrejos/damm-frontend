"use client";

import { useEffect } from "react";

import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";

export function ClientsListPage() {
  const { setCrumbs } = useBreadcrumb();

  useEffect(() => {
    setCrumbs([{ label: "Clients" }]);
    return () => setCrumbs([]);
  }, [setCrumbs]);

  return (
    <PageLayout>
      <div className="px-6 md:px-10 pt-8 pb-10" />
    </PageLayout>
  );
}
