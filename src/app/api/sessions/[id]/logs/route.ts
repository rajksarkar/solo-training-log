import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bulkUpsertLogsSchema } from "@/lib/validations/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await params;
  const s = await prisma.session.findFirst({
    where: { id: sessionId, ownerId: session.user.id },
    include: { exercises: true },
  });

  if (!s) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = bulkUpsertLogsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const exerciseIds = s.exercises.map((e) => e.id);
    for (const log of parsed.data.logs) {
      if (!exerciseIds.includes(log.sessionExerciseId)) {
        return NextResponse.json(
          { error: "Session exercise not in this session" },
          { status: 400 }
        );
      }
    }

    const results = await Promise.all(
      parsed.data.logs.map((log) =>
        prisma.setLog.upsert({
          where: {
            sessionExerciseId_setIndex: {
              sessionExerciseId: log.sessionExerciseId,
              setIndex: log.setIndex,
            },
          },
          create: {
            sessionExerciseId: log.sessionExerciseId,
            setIndex: log.setIndex,
            reps: log.reps ?? null,
            weight: log.weight ?? null,
            unit: log.unit ?? "lb",
            durationSec: log.durationSec ?? null,
            distanceMeters: log.distanceMeters ?? null,
            rpe: log.rpe ?? null,
            completed: log.completed ?? true,
            notes: log.notes ?? null,
          },
          update: {
            reps: log.reps ?? null,
            weight: log.weight ?? null,
            unit: log.unit ?? "lb",
            durationSec: log.durationSec ?? null,
            distanceMeters: log.distanceMeters ?? null,
            rpe: log.rpe ?? null,
            completed: log.completed ?? true,
            notes: log.notes ?? null,
          },
        })
      )
    );

    return NextResponse.json(results);
  } catch (err) {
    console.error("Upsert logs error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
