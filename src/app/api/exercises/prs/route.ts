import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const exerciseIds = searchParams.get("exerciseIds")?.split(",").filter(Boolean);

  // Get all completed set logs with weight data for the user's exercises
  const where: Record<string, unknown> = {
    sessionExercise: {
      session: { ownerId: session.user.id },
    },
    completed: true,
    weight: { not: null, gt: 0 },
    reps: { not: null, gt: 0 },
  };

  if (exerciseIds?.length) {
    where.sessionExercise = {
      ...where.sessionExercise as object,
      exerciseId: { in: exerciseIds },
    };
  }

  const setLogs = await prisma.setLog.findMany({
    where,
    select: {
      reps: true,
      weight: true,
      unit: true,
      sessionExercise: {
        select: {
          exerciseId: true,
        },
      },
    },
  });

  // Build PR map: exerciseId -> { repMaxes: {reps: maxWeight}, bestSet: {weight, reps, unit} }
  const prMap: Record<string, {
    repMaxes: Record<number, { weight: number; unit: string }>;
    bestSet: { weight: number; reps: number; unit: string } | null;
  }> = {};

  for (const log of setLogs) {
    const exId = log.sessionExercise.exerciseId;
    const reps = log.reps!;
    const weight = Number(log.weight!);
    const unit = log.unit;

    if (!prMap[exId]) {
      prMap[exId] = { repMaxes: {}, bestSet: null };
    }

    const entry = prMap[exId];

    // Track rep max (highest weight for each rep count)
    if (!entry.repMaxes[reps] || weight > entry.repMaxes[reps].weight) {
      entry.repMaxes[reps] = { weight, unit };
    }

    // Track overall best set (heaviest weight with its reps)
    if (!entry.bestSet || weight > entry.bestSet.weight) {
      entry.bestSet = { weight, reps, unit };
    }
  }

  return NextResponse.json(prMap);
}
