"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        setError("Invalid code");
        setLoading(false);
        return;
      }

      router.push("/app");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[340px] animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Dumbbell className="h-8 w-8 text-on-primary" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text uppercase">
            Solo Training
          </h1>
          <p className="text-sm text-text-secondary mt-1">Enter your code to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-error bg-error/10 border border-error/20 px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Access code"
            autoFocus
            required
            className="w-full h-14 px-5 rounded-xl bg-surface border border-border text-text text-lg text-center tracking-[0.2em] placeholder:text-text-muted placeholder:tracking-normal focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />

          <button
            type="submit"
            disabled={loading || !code}
            className="w-full h-14 rounded-xl bg-primary text-on-primary font-bold text-base uppercase tracking-wider hover:bg-primary-bright active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            {loading ? "..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
