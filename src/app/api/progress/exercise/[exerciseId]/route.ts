import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { exerciseId } = await params;
  const limit = 50;

  const exercise = await prisma.exercise.findFirst({
    where: {
      id: exerciseId,
      OR: [{ ownerId: null }, { ownerId: session.user.id }],
    },
  });

  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const sessionExercises = await prisma.sessionExercise.findMany({
    where: {
      exerciseId,
      session: { ownerId: session.user.id, date: { lte: today } },
    },
    include: {
      session: { select: { id: true, title: true, date: true } },
      setLogs: { orderBy: { setIndex: "asc" } },
    },
    orderBy: { session: { date: "desc" } },
    take: limit,
  });

  const dataPoints: {
    date: string;
    sessionId: string;
    bestSet: { reps: number; weight: number; unit: string } | null;
    volume: number;
    durationSec: number | null;
    rpe: number | null;
    bestReps: number | null;
    totalReps: number;
    estimated1RM: number | null;
  }[] = [];

  const history: {
    date: string;
    sessionId: string;
    sessionTitle: string;
    sets: { reps: number | null; weight: number | null; unit: string; durationSec: number | null }[];
  }[] = [];

  for (const se of sessionExercises) {
    // Only count sets the user actually ticked off. Scheduled/planned
    // logs that were never completed shouldn't appear in history, charts,
    // or PR lists — they aren't performances.
    const completedLogs = se.setLogs.filter((l) => l.completed);
    if (completedLogs.length === 0) continue;

    // Use local-calendar date components, not UTC, so a session whose
    // date is stored as YYYY-MM-DDT00:00:00.000Z doesn't shift one day
    // earlier when displayed in negative-UTC timezones.
    const d = se.session.date;
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    let bestSet: { reps: number; weight: number; unit: string } | null = null;
    let volume = 0;
    let durationSec: number | null = null;
    let rpe: number | null = null;
    let bestReps: number | null = null;
    let totalReps = 0;

    const sets: { reps: number | null; weight: number | null; unit: string; durationSec: number | null }[] = [];

    for (const log of completedLogs) {
      sets.push({
        reps: log.reps,
        weight: log.weight != null ? Number(log.weight) : null,
        unit: log.unit,
        durationSec: log.durationSec,
      });

      if (log.reps != null) {
        totalReps += log.reps;
        if (bestReps === null || log.reps > bestReps) {
          bestReps = log.reps;
        }
      }

      if (log.reps != null && log.weight != null) {
        const w = Number(log.weight);
        const r = log.reps;
        volume += w * r;
        if (!bestSet || w > bestSet.weight) {
          bestSet = { reps: r, weight: w, unit: log.unit };
        }
      }
      if (log.durationSec != null) {
        durationSec = (durationSec ?? 0) + log.durationSec;
      }
      if (log.rpe != null) rpe = log.rpe;
    }

    let bestE1RM = 0;
    for (const log of completedLogs) {
      if (log.reps != null && log.weight != null && Number(log.weight) > 0 && log.reps > 0 && log.reps <= 12) {
        const e1rm = Number(log.weight) * (1 + log.reps / 30);
        if (e1rm > bestE1RM) {
          bestE1RM = e1rm;
        }
      }
    }

    dataPoints.push({
      date,
      sessionId: se.sessionId,
      bestSet,
      volume,
      durationSec: durationSec || null,
      rpe,
      bestReps,
      totalReps,
      estimated1RM: bestE1RM > 0 ? Math.round(bestE1RM * 10) / 10 : null,
    });

    history.push({
      date,
      sessionId: se.sessionId,
      sessionTitle: se.session.title,
      sets,
    });
  }

  const allTimeE1RM = dataPoints.reduce((max, d) => {
    if (d.estimated1RM != null && d.estimated1RM > max) return d.estimated1RM;
    return max;
  }, 0);

  return NextResponse.json({
    exercise,
    dataPoints: dataPoints.reverse(),
    recentPRs: dataPoints
      .filter((d) => d.bestSet != null)
      .slice(-10)
      .reverse(),
    history,
    allTimeE1RM: allTimeE1RM > 0 ? allTimeE1RM : null,
  });
}
