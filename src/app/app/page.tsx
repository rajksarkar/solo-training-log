import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Calendar, Dumbbell, TrendingUp, Zap } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  strength: "bg-primary-container text-on-primary-container",
  cardio: "bg-error-container text-on-error-container",
  zone2: "bg-accent-teal-soft text-on-primary-container",
  pilates: "bg-accent-rose-soft text-on-error-container",
  mobility: "bg-tertiary-container text-on-tertiary-container",
  plyometrics: "bg-accent-slate-soft text-on-primary-container",
  stretching: "bg-secondary-container text-on-secondary-container",
  other: "bg-surface-container-high text-on-surface-variant",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayStart = new Date(today);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const [todaySession, last7Sessions, totalSessions] = await Promise.all([
    prisma.session.findFirst({
      where: {
        ownerId: session.user.id,
        date: { gte: todayStart, lte: todayEnd },
      },
      include: { exercises: { include: { exercise: true } } },
    }),
    prisma.session.findMany({
      where: { ownerId: session.user.id, date: { gte: weekAgo } },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.session.count({
      where: { ownerId: session.user.id },
    }),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display italic text-on-surface">
          Hey, {firstName}
        </h1>
        <p className="text-on-surface-variant mt-1">
          {todaySession
            ? "You have an active session today. Keep it going."
            : "Ready to train? Start a new session."}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-up stagger-1">
        <div className="rounded-2xl bg-primary p-4 sm:p-5 text-on-primary">
          <Zap className="h-5 w-5 mb-2 opacity-80" />
          <p className="text-2xl font-semibold">{last7Sessions.length}</p>
          <p className="text-xs opacity-70 mt-0.5">Sessions this week</p>
        </div>
        <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-4 sm:p-5 shadow-elevation-1">
          <Calendar className="h-5 w-5 mb-2 text-tertiary" />
          <p className="text-2xl font-semibold text-on-surface">{totalSessions}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">Total sessions</p>
        </div>
        <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-4 sm:p-5 shadow-elevation-1 col-span-2 sm:col-span-1">
          <TrendingUp className="h-5 w-5 mb-2 text-primary" />
          <p className="text-2xl font-semibold text-on-surface">
            {todaySession ? todaySession.exercises.length : 0}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">Exercises today</p>
        </div>
      </div>

      {/* Today's session / CTA */}
      <Card className="animate-fade-up stagger-2 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-tertiary" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Today
          </CardTitle>
          <p className="text-sm text-on-surface-variant">
            {todaySession
              ? `Continue or view: ${todaySession.title}`
              : "Start a new session or pick a template"}
          </p>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          {todaySession ? (
            <Link href={`/app/sessions/${todaySession.id}`}>
              <Button className="gap-2">
                Continue Session
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/app/sessions?new=1">
              <Button className="gap-2">
                Start Session
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link href="/app/templates">
            <Button variant="outline">Browse Templates</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent sessions */}
      <div className="animate-fade-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-on-surface">Recent Activity</h2>
          <Link href="/app/sessions" className="text-sm text-primary font-medium hover:underline">
            View all
          </Link>
        </div>
        {last7Sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-on-surface-variant">
              No sessions yet. Create your first one to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {last7Sessions.map((s) => (
              <Link key={s.id} href={`/app/sessions/${s.id}`}>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:shadow-elevation-2 hover:border-primary/20 transition-all duration-200 group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${CATEGORY_COLORS[s.category] ?? CATEGORY_COLORS.other}`}>
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                      {s.title}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {new Date(s.date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      <span className="mx-1.5 text-outline-variant">·</span>
                      <span className="capitalize">{s.category}</span>
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
