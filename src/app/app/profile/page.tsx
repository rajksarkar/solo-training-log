import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LogoutButton } from "@/components/logout-button";
import { Dumbbell, Calendar, TrendingUp } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [totalSessions, totalExerciseLogs, recentSessions] = await Promise.all([
    prisma.session.count({ where: { ownerId: session.user.id } }),
    prisma.sessionExercise.count({
      where: { session: { ownerId: session.user.id } },
    }),
    prisma.session.findMany({
      where: { ownerId: session.user.id },
      orderBy: { date: "desc" },
      take: 1,
    }),
  ]);

  const lastWorkout = recentSessions[0];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Profile header */}
      <div className="text-center py-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-text">
          {session.user.name ?? "Athlete"}
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {session.user.email}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-surface border border-border p-4 text-center">
          <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-text">{totalSessions}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
            Workouts
          </p>
        </div>
        <div className="rounded-xl bg-surface border border-border p-4 text-center">
          <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-text">{totalExerciseLogs}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
            Exercises
          </p>
        </div>
        <div className="rounded-xl bg-surface border border-border p-4 text-center">
          <Dumbbell className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-sm font-bold text-text">
            {lastWorkout
              ? new Date(lastWorkout.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "--"}
          </p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
            Last Workout
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <LogoutButton className="w-full justify-center py-3 border border-border rounded-xl" />
      </div>
    </div>
  );
}
