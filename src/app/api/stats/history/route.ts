import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get all session exercises with set logs for exercise rankings
  const sessionExercises = await prisma.sessionExercise.findMany({
    where: {
      session: { ownerId: userId },
    },
    select: {
      exerciseId: true,
      exercise: { select: { name: true, category: true } },
      session: { select: { id: true, date: true } },
      setLogs: {
        where: { completed: true },
        select: {
          reps: true,
          weight: true,
          unit: true,
        },
      },
    },
  });

  // Build exercise rankings: count unique sessions per exercise and track PRs
  const exerciseMap: Record<string, {
    name: string;
    category: string;
    sessionIds: Set<string>;
    bestWeight: number;
    bestReps: number;
    bestUnit: string;
  }> = {};

  for (const se of sessionExercises) {
    const exId = se.exerciseId;
    if (!exerciseMap[exId]) {
      exerciseMap[exId] = {
        name: se.exercise.name,
        category: se.exercise.category,
        sessionIds: new Set(),
        bestWeight: 0,
        bestReps: 0,
        bestUnit: "lb",
      };
    }

    const entry = exerciseMap[exId];
    entry.sessionIds.add(se.session.id);

    for (const log of se.setLogs) {
      if (log.weight != null && Number(log.weight) > entry.bestWeight) {
        entry.bestWeight = Number(log.weight);
        entry.bestReps = log.reps ?? 0;
        entry.bestUnit = log.unit;
      }
    }
  }

  const exerciseRankings = Object.entries(exerciseMap)
    .map(([exerciseId, data]) => ({
      exerciseId,
      name: data.name,
      category: data.category,
      sessionCount: data.sessionIds.size,
      pr: data.bestWeight > 0
        ? { weight: data.bestWeight, reps: data.bestReps, unit: data.bestUnit }
        : null,
    }))
    .sort((a, b) => b.sessionCount - a.sessionCount);

  // 30-day trends: daily totals
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const recentSessions = await prisma.session.findMany({
    where: {
      ownerId: userId,
      date: { gte: thirtyDaysAgo },
    },
    select: {
      id: true,
      date: true,
      startedAt: true,
      endedAt: true,
      exercises: {
        select: {
          setLogs: {
            where: { completed: true },
            select: {
              reps: true,
              weight: true,
            },
          },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  // Aggregate by date
  const dailyMap: Record<string, {
    date: string;
    totalReps: number;
    totalWeight: number;
    sessionCount: number;
    sessionTimeSec: number;
  }> = {};

  for (const s of recentSessions) {
    const dateKey = s.date.toISOString().slice(0, 10);
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        date: dateKey,
        totalReps: 0,
        totalWeight: 0,
        sessionCount: 0,
        sessionTimeSec: 0,
      };
    }

    const day = dailyMap[dateKey];
    day.sessionCount++;

    if (s.startedAt && s.endedAt) {
      const dur = (s.endedAt.getTime() - s.startedAt.getTime()) / 1000;
      if (dur > 0 && dur < 86400) {
        day.sessionTimeSec += dur;
      }
    }

    for (const ex of s.exercises) {
      for (const log of ex.setLogs) {
        if (log.reps != null) {
          day.totalReps += log.reps;
        }
        if (log.reps != null && log.weight != null) {
          day.totalWeight += log.reps * Number(log.weight);
        }
      }
    }
  }

  // Fill in missing days in the last 30 days
  const trends: typeof dailyMap[string][] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trends.push(dailyMap[key] ?? {
      date: key,
      totalReps: 0,
      totalWeight: 0,
      sessionCount: 0,
      sessionTimeSec: 0,
    });
  }

  return NextResponse.json({
    exerciseRankings,
    trends,
  });
}
