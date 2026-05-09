"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  IconBuildingWarehouse,
  IconSteeringWheel,
  IconTruck,
  IconUsers,
} from "@tabler/icons-react";

const items = [
  { href: "/", label: "Centers", Icon: IconBuildingWarehouse },
  { href: "/clients", label: "Clients", Icon: IconUsers },
  { href: "/trucks", label: "Trucks", Icon: IconTruck },
  { href: "/drivers", label: "Drivers", Icon: IconSteeringWheel },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-canvas px-2 pt-4 overflow-y-auto transform transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:static md:translate-x-0 md:transform-none md:shrink-0`}
        aria-label="Primary"
      >
        <nav className="pt-1">
          <div className="mb-1 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">
            Workspace
          </div>
          <ul className="space-y-0.5">
            {items.map(({ href, label, Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={onClose}
                    className={`flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] transition-colors ${
                      active
                        ? "bg-white/[0.07] text-ink"
                        : "text-ink-subtle hover:bg-white/[0.04] hover:text-ink"
                    }`}
                  >
                    <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                    <span className="flex-1 truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
