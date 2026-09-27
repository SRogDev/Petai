"use client";

import { House, Images, Users, Wand2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/cn";

const ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/create", label: "Create", icon: Wand2 },
  { href: "/social", label: "Social", icon: Users },
  { href: "/gallery", label: "Gallery", icon: Images },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[64px] flex-col items-center justify-center gap-1 text-xs font-bold transition-colors",
                  active
                    ? "text-primary"
                    : "text-foreground/60 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl border-[3px] transition-all",
                    active
                      ? "border-border bg-primary/15 shadow-[0_3px_0_0_#fdba74]"
                      : "border-transparent",
                  )}
                >
                  <Icon size={22} strokeWidth={2.5} aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
