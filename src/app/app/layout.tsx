import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { MobileNav } from "@/components/bottom-nav";
import { Dumbbell, Calendar, Clock, Scale, Brain } from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const nav = [
    { href: "/app", label: "Training", icon: Calendar },
    { href: "/app/body-weight", label: "Weight", icon: Scale },
    { href: "/app/history", label: "History", icon: Clock },
    { href: "/app/exercises", label: "Exercises", icon: Dumbbell },
    { href: "/app/alcohol", label: "Alcohol", icon: Brain },
  ];

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden sm:h-auto sm:min-h-screen sm:overflow-visible">
      {/* Header */}
      <header className="shrink-0 glass-dark z-40 border-b border-border pt-[env(safe-area-inset-top)] sm:sticky sm:top-0 sm:pt-0">
        <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link
            href="/app"
            className="font-extrabold text-text text-sm tracking-wider uppercase hover:text-primary transition-colors flex items-center gap-2"
          >
            <Dumbbell className="h-5 w-5 text-primary" />
            Solo Training
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 bg-surface-high rounded-lg px-1 py-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-[13px] font-medium text-text-secondary hover:text-text hover:bg-surface-highest rounded-lg flex items-center gap-2 transition-all duration-200"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-text-muted truncate max-w-[140px]">
              {session?.user?.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto overscroll-y-contain sm:overflow-visible sm:overscroll-auto pb-20 sm:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-2xl">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
