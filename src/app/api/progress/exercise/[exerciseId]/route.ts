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

  const sessionExercises = await prisma.sessionExercise.findMany({
    where: {
      exerciseId,
      session: { ownerId: session.user.id },
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
    const date = se.session.date.toISOString().slice(0, 10);
    let bestSet: { reps: number; weight: number; unit: string } | null = null;
    let volume = 0;
    let durationSec: number | null = null;
    let rpe: number | null = null;
    let bestReps: number | null = null;
    let totalReps = 0;

    const sets: { reps: number | null; weight: number | null; unit: string; durationSec: number | null }[] = [];

    for (const log of se.setLogs) {
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
    for (const log of se.setLogs) {
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
