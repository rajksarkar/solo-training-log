"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Dumbbell, Clock, User, Scale } from "lucide-react";

const nav = [
  { href: "/app", label: "Training", icon: Calendar },
  { href: "/app/body-weight", label: "Weight", icon: Scale },
  { href: "/app/history", label: "History", icon: Clock },
  { href: "/app/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/app/profile", label: "Me", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  }

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 glass-dark border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center">
        {nav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-text-muted"
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
