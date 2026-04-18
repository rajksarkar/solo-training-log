import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeExercise, rankSwapCandidates } from "@/lib/exercise-swap";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; seId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId, seId } = await params;

  const se = await prisma.sessionExercise.findFirst({
    where: {
      id: seId,
      session: { id: sessionId, ownerId: session.user.id },
    },
    include: { exercise: true, session: { select: { exercises: { select: { exerciseId: true } } } } },
  });

  if (!se) {
    return NextResponse.json({ error: "Session exercise not found" }, { status: 404 });
  }

  const pool = await prisma.exercise.findMany({
    where: {
      category: se.exercise.category,
      OR: [{ ownerId: null }, { ownerId: session.user.id }],
    },
  });

  const usedIds = new Set(se.session.exercises.map((e) => e.exerciseId));
  const source = normalizeExercise(se.exercise);
  const candidates = rankSwapCandidates(
    source,
    pool
      .filter((e) => e.id === se.exerciseId || !usedIds.has(e.id))
      .map(normalizeExercise),
    12
  );

  return NextResponse.json({ source, candidates });
}
