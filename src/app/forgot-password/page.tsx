"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-mesh flex relative overflow-hidden">
      <div className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full bg-primary/[0.05] blur-3xl" />

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-[400px] animate-scale-in">
          <div className="text-center mb-10">
            <h1 className="font-display italic text-3xl text-on-surface">Solo</h1>
            <p className="text-sm text-on-surface-variant mt-1">Training Log</p>
          </div>

          <div className="bg-surface-container-lowest/90 rounded-2xl border border-outline-variant/30 shadow-elevation-2 p-7">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-on-surface">Forgot password</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            {submitted ? (
              <div className="space-y-4">
                <p className="text-sm text-on-surface-variant bg-primary-container/30 p-4 rounded-xl">
                  If an account exists with that email, you&apos;ll receive a reset link shortly.
                </p>
                <Link href="/login" className="text-primary font-medium hover:underline text-sm">
                  Back to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <p className="text-sm text-on-error-container bg-error-container p-3 rounded-xl">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
                <p className="text-center text-sm text-on-surface-variant">
                  <Link href="/login" className="text-primary font-medium hover:underline">
                    Back to login
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
