"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app";
  const resetSuccess = searchParams.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-mesh flex relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full bg-primary/[0.05] blur-3xl" />
      <div className="absolute bottom-[20%] right-[10%] w-80 h-80 rounded-full bg-tertiary/[0.04] blur-3xl" />

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-[400px] animate-scale-in">
          {/* Logo */}
          <div className="text-center mb-10">
            <h1 className="font-display italic text-3xl text-on-surface">Solo</h1>
            <p className="text-sm text-on-surface-variant mt-1">Training Log</p>
          </div>

          {/* Card */}
          <div className="bg-surface-container-lowest/90 rounded-2xl border border-outline-variant/30 shadow-elevation-2 p-7">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-on-surface">Welcome back</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Sign in to continue your training
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {resetSuccess && (
                <p className="text-sm text-primary bg-primary-container/50 p-3 rounded-xl">
                  Password reset successfully. Log in with your new password.
                </p>
              )}
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Log in"}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center gradient-mesh">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
