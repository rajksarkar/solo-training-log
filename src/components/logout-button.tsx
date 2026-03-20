"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleLogout() {
    // Clear the auth cookie by hitting the logout endpoint
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text hover:bg-surface-high rounded-lg transition-all ${className ?? ""}`}
    >
      <LogOut className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Log out</span>
    </button>
  );
}
