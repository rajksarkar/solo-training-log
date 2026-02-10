"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<Record<string, string[]> | string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError({ confirmPassword: ["Passwords don't match"] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      await signIn("credentials", { email, password, redirect: false });
      router.push("/app");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const errMsg =
    typeof error === "string"
      ? error
      : error && typeof error === "object"
        ? Object.values(error).flat().join(", ")
        : null;

  return (
    <div className="min-h-screen gradient-mesh flex relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-[30%] right-[15%] w-72 h-72 rounded-full bg-primary/[0.05] blur-3xl" />
      <div className="absolute bottom-[10%] left-[15%] w-64 h-64 rounded-full bg-tertiary/[0.04] blur-3xl" />

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
              <h2 className="text-xl font-semibold text-on-surface">Create account</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Start tracking your training journey
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errMsg && (
                <p className="text-sm text-on-error-container bg-error-container p-3 rounded-xl">
                  {errMsg}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
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
                {loading ? "Creating account..." : "Sign up"}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
