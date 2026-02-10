import Link from "next/link";
import Image from "next/image";
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
    <div className="h-[100dvh] flex flex-col overflow-hidden sm:h-auto sm:min-h-screen sm:overflow-visible">
      <header className="shrink-0 glass-dark z-40 border-b border-white/[0.06] pt-[env(safe-area-inset-top)] sm:sticky sm:top-0 sm:pt-0">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/app" className="font-semibold text-white text-[15px] tracking-tight truncate min-w-0 flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Image src="/icon-192.png" alt="" width={28} height={28} className="rounded-lg" />
            <span className="font-display italic">Solo</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-0.5 bg-white/[0.06] rounded-full px-1 py-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/[0.08] rounded-full flex items-center gap-2 transition-all duration-200"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-[13px] text-white/50 truncate max-w-[140px]">{session?.user?.email}</span>
            <LogoutButton />
          </div>
          <LogoutButton className="sm:hidden" />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto overscroll-y-contain sm:overflow-visible sm:overscroll-auto">
        <div className="container mx-auto px-4 sm:px-6 py-6 max-w-5xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
