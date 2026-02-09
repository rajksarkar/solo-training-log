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

  const se = await prisma.sessionExercise.findFirst({
    where: {
      exerciseId,
      session: { ownerId: session.user.id },
    },
    include: {
      setLogs: { orderBy: { setIndex: "asc" } },
    },
    orderBy: { session: { date: "desc" } },
  });

  if (!se) {
    return NextResponse.json({ bestSet: null });
  }

  let bestSet: { reps: number; weight: number; unit: string } | null = null;
  for (const log of se.setLogs) {
    if (log.reps != null && log.weight != null) {
      const w = Number(log.weight);
      const r = log.reps;
      if (!bestSet || w > bestSet.weight) {
        bestSet = { reps: r, weight: w, unit: log.unit };
      }
    }
  }

  return NextResponse.json({ bestSet });
}
