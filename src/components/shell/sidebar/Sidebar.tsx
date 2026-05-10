"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconBuildingWarehouse,
  IconClipboardList,
  IconDotsVertical,
  IconLogout,
  IconSteeringWheel,
  IconTruck,
  IconUsers,
} from "@tabler/icons-react";

import { AUTH_FLAG_KEY } from "@/components/auth/LoginForm";
import { clearStoredChat } from "@/components/chat/ChatProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const items = [
  { href: "/", label: "Centers", Icon: IconBuildingWarehouse },
  { href: "/clients", label: "Clients", Icon: IconUsers },
  { href: "/trucks", label: "Trucks", Icon: IconTruck },
  { href: "/drivers", label: "Drivers", Icon: IconSteeringWheel },
  { href: "/orders", label: "Orders", Icon: IconClipboardList },
] as const;

// Mock user — replace with real session data when auth lands.
const mockUser = {
  name: "Damm User",
  email: "user@damm.com",
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_FLAG_KEY);
    }
    clearStoredChat();
    router.replace("/login");
  };

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
        className={`fixed inset-y-0 left-0 z-50 flex w-52 flex-col bg-canvas px-2 pt-4 pb-2 transform transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:static md:translate-x-0 md:transform-none md:shrink-0`}
        aria-label="Primary"
      >
        <nav className="flex-1 overflow-y-auto pt-1">
          <div className="mb-1 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-ink data-[popup-open]:bg-white/[0.06] data-[popup-open]:text-ink"
                aria-label="Open user menu"
              />
            }
          >
            <UserAvatar name={mockUser.name} />
            <div className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate font-medium text-ink">
                {mockUser.name}
              </span>
              <span className="truncate text-[11px] text-ink-subtle">
                {mockUser.email}
              </span>
            </div>
            <IconDotsVertical className="ml-auto size-4 shrink-0" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="min-w-56"
          >
            <div className="flex items-center gap-2 px-1.5 py-1.5">
              <UserAvatar name={mockUser.name} />
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{mockUser.name}</span>
                <span className="truncate text-xs text-ink-subtle">
                  {mockUser.email}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <IconLogout className="size-4" aria-hidden />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>
    </>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-[11px] font-semibold text-ink"
    >
      {initials || "U"}
    </span>
  );
}
