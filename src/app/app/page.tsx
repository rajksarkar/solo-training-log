import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayStart = new Date(today);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const [todaySession, last7Sessions] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>
        <p className="text-on-surface-variant mt-1">
          Welcome back, {session.user.name ?? session.user.email}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <CardDescription>
            {todaySession
              ? `Continue or view your session: ${todaySession.title}`
              : "Start a new session or pick a template"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          {todaySession ? (
            <Link href={`/app/sessions/${todaySession.id}`}>
              <Button>Continue Session</Button>
            </Link>
          ) : (
            <Link href="/app/sessions?new=1">
              <Button>Start Session</Button>
            </Link>
          )}
          <Link href="/app/templates">
            <Button variant="outline">Browse Templates</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Last 7 Days</CardTitle>
          <CardDescription>Recent training sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {last7Sessions.length === 0 ? (
            <p className="text-on-surface-variant text-sm">No sessions yet</p>
          ) : (
            <ul className="space-y-2">
              {last7Sessions.map((s) => (
                <li key={s.id} className="flex justify-between items-center">
                  <Link
                    href={`/app/sessions/${s.id}`}
                    className="text-primary hover:underline"
                  >
                    {s.title}
                  </Link>
                  <span className="text-sm text-on-surface-variant">
                    {new Date(s.date).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
