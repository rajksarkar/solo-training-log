import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dumbbell, TrendingUp, Calendar, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen gradient-mesh relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute top-20 right-[10%] w-72 h-72 rounded-full bg-primary/[0.04] blur-3xl" />
      <div className="absolute bottom-20 left-[5%] w-96 h-96 rounded-full bg-tertiary/[0.03] blur-3xl" />

      {/* Header */}
      <header className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-display italic text-xl text-on-surface">Solo</span>
        <div className="flex gap-3">
          {session ? (
            <Link href="/app">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 container mx-auto px-6 pt-16 sm:pt-28 pb-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-widest uppercase text-primary mb-4 animate-fade-up">
            Your training companion
          </p>
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-display italic leading-[1.05] tracking-tight text-on-surface animate-fade-up stagger-1">
            Train with{" "}
            <span className="text-primary">intention.</span>
            <br />
            Track with{" "}
            <span className="text-tertiary">clarity.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-on-surface-variant leading-relaxed max-w-xl animate-fade-up stagger-2">
            Strength, cardio, Zone 2, pilates, mobility — every session
            captured in one beautifully simple log.
          </p>
          <div className="mt-10 flex gap-4 flex-wrap animate-fade-up stagger-3">
            {session ? (
              <Link href="/app">
                <Button size="lg" className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                    Start Training
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    I have an account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-20 sm:mt-28 grid sm:grid-cols-3 gap-5 animate-fade-up stagger-4">
          {[
            {
              icon: Dumbbell,
              title: "109+ Exercises",
              desc: "Curated library across 8 categories. Add your own custom moves.",
              accent: "bg-primary-container text-primary",
            },
            {
              icon: Calendar,
              title: "Smart Sessions",
              desc: "Templates for speed. Autosave while you train. Never lose a rep.",
              accent: "bg-tertiary-container text-tertiary",
            },
            {
              icon: TrendingUp,
              title: "Visual Progress",
              desc: "Charts that show your journey. PRs tracked. Volume over time.",
              accent: "bg-secondary-container text-secondary",
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className="group p-6 rounded-2xl bg-surface-container-lowest/80 border border-outline-variant/30 shadow-elevation-1 hover:shadow-elevation-3 hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl ${feat.accent} flex items-center justify-center mb-4`}>
                <feat.icon className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-semibold text-on-surface mb-2">{feat.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-outline-variant/30 py-8 text-center text-[13px] text-on-surface-variant/60">
        Solo Training Log
      </footer>
    </div>
  );
}
