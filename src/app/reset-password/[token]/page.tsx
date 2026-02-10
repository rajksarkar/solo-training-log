"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
      } else {
        router.push("/login?reset=1");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-mesh flex relative overflow-hidden">
      <div className="absolute bottom-[20%] right-[10%] w-72 h-72 rounded-full bg-tertiary/[0.04] blur-3xl" />

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-[400px] animate-scale-in">
          <div className="text-center mb-10">
            <h1 className="font-display italic text-3xl text-on-surface">Solo</h1>
            <p className="text-sm text-on-surface-variant mt-1">Training Log</p>
          </div>

          <div className="bg-surface-container-lowest/90 rounded-2xl border border-outline-variant/30 shadow-elevation-2 p-7">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-on-surface">Reset password</h2>
              <p className="text-sm text-on-surface-variant mt-1">Enter your new password</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <p className="text-sm text-on-error-container bg-error-container p-3 rounded-xl">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset password"}
              </Button>
              <p className="text-center text-sm text-on-surface-variant">
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Back to login
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
