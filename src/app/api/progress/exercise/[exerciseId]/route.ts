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
  const limit = 30;

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
      session: true,
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
  }[] = [];

  for (const se of sessionExercises) {
    const date = se.session.date.toISOString().slice(0, 10);
    let bestSet: { reps: number; weight: number; unit: string } | null = null;
    let volume = 0;
    let durationSec: number | null = null;
    let rpe: number | null = null;

    for (const log of se.setLogs) {
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

    dataPoints.push({
      date,
      sessionId: se.sessionId,
      bestSet,
      volume,
      durationSec: durationSec || null,
      rpe,
    });
  }

  return NextResponse.json({
    exercise,
    dataPoints: dataPoints.reverse(),
    recentPRs: dataPoints
      .filter((d) => d.bestSet != null)
      .slice(-10)
      .reverse(),
  });
}
