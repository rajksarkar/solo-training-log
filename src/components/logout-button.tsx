"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`text-white/60 hover:text-white hover:bg-white/[0.08] ${className ?? ""}`}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut className="h-4 w-4 sm:mr-1" />
      <span className="hidden sm:inline">Log out</span>
    </Button>
  );
}
