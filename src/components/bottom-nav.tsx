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

export function MobileNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  }

  return (
    <nav className="sm:hidden border-t border-white/[0.06] px-3 py-2">
      <div className="flex items-center gap-1">
        {nav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] font-medium transition-all duration-200 ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white/70 hover:bg-white/[0.06]"
              }`}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
