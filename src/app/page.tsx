import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface">
      <div className="text-center space-y-8 max-w-2xl px-6">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface">
          Solo Training Log
        </h1>
        <p className="text-lg text-on-surface-variant">
          Track your workouts, build training plans, and watch your progress over time.
          Strength, cardio, Zone 2, pilates—all in one place.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          {session ? (
            <Link href="/app">
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button size="lg">Log In</Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
