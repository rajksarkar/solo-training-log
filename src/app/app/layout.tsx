import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { BottomNav } from "@/components/bottom-nav";
import {
  LayoutDashboard,
  Dumbbell,
  FileText,
  Calendar,
} from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const nav = [
    { href: "/app", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/exercises", label: "Exercises", icon: Dumbbell },
    { href: "/app/templates", label: "Templates", icon: FileText },
    { href: "/app/sessions", label: "Sessions", icon: Calendar },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-20 sm:pb-0">
      <header className="bg-surface sticky top-0 z-40 shadow-elevation-1">
        <div className="container mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          <Link href="/app" className="font-semibold text-on-surface text-sm sm:text-base truncate min-w-0">
            Solo Training Log
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm text-on-surface-variant hover:text-on-surface hover:bg-primary/[0.08] rounded-full flex items-center gap-2 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-on-surface-variant truncate max-w-[120px]">{session?.user?.email}</span>
            <LogoutButton />
          </div>
          <LogoutButton className="sm:hidden" />
        </div>
      </header>
      <BottomNav />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 max-w-full">{children}</main>
    </div>
  );
}
