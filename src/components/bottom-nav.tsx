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
    <nav className="sm:hidden shrink-0 z-40 glass border-t border-outline-variant/30 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16">
        {nav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 min-w-[64px] min-h-[48px] justify-center group"
            >
              <div
                className={`flex items-center justify-center h-8 w-14 rounded-full transition-all duration-200 ${
                  active
                    ? "bg-primary text-on-primary scale-100"
                    : "text-on-surface-variant group-hover:bg-on-surface/[0.05]"
                }`}
              >
                <item.icon
                  className={`h-[18px] w-[18px] transition-all duration-200 ${
                    active ? "text-on-primary" : ""
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                  active ? "text-primary" : "text-on-surface-variant"
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
