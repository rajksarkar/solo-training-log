"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  FileText,
  Calendar,
} from "lucide-react";

const nav = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/app/templates", label: "Templates", icon: FileText },
  { href: "/app/sessions", label: "Sessions", icon: Calendar },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  }

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container h-20 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-full">
        {nav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 min-w-[64px] min-h-[48px] justify-center"
            >
              <div
                className={`flex items-center justify-center h-8 w-16 rounded-full transition-colors ${
                  active ? "bg-secondary-container" : ""
                }`}
              >
                <item.icon
                  className={`h-6 w-6 ${
                    active ? "text-on-secondary-container" : "text-on-surface-variant"
                  }`}
                />
              </div>
              <span
                className={`text-xs font-medium ${
                  active ? "text-on-surface" : "text-on-surface-variant"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
