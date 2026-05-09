"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { RouteHero } from "@/components/routes/RouteHero";
import type { Route } from "@/components/routes/columns";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";

type Props = {
  route: Route;
};

export function RoutePreviewClient({ route }: Props) {
  const router = useRouter();
  const { setCrumbs } = useBreadcrumb();

  useEffect(() => {
    setCrumbs([
      { label: "Preview", onClick: () => router.push("/") },
      { label: route.route_code },
    ]);
    return () => setCrumbs([]);
  }, [route.route_code, router, setCrumbs]);

  return (
    <PageLayout>
      <div className="px-6 md:px-10 pt-8 pb-10 flex flex-col gap-7">
        <RouteHero route={route} onBack={() => router.push("/")} />
      </div>
    </PageLayout>
  );
}
