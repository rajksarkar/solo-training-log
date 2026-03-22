import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get all sessions with exercises and set logs
  const sessions = await prisma.session.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      title: true,
      category: true,
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
    orderBy: { date: "desc" },
  });

  let totalReps = 0;
  let totalWeight = 0;
  let totalSessionTimeSec = 0;
  let sessionsWithTime = 0;

  for (const s of sessions) {
    // Sum session time from startedAt/endedAt
    if (s.startedAt && s.endedAt) {
      const dur = (s.endedAt.getTime() - s.startedAt.getTime()) / 1000;
      if (dur > 0 && dur < 86400) { // Sanity: less than 24h
        totalSessionTimeSec += dur;
        sessionsWithTime++;
      }
    }

    for (const ex of s.exercises) {
      for (const log of ex.setLogs) {
        if (log.reps != null) {
          totalReps += log.reps;
        }
        if (log.reps != null && log.weight != null) {
          totalWeight += log.reps * Number(log.weight);
        }
      }
    }
  }

  // Last workout with details
  const lastSession = sessions.length > 0 ? sessions[0] : null;
  let lastWorkout = null;
  if (lastSession) {
    const fullSession = await prisma.session.findFirst({
      where: { id: lastSession.id },
      include: {
        exercises: {
          include: {
            exercise: { select: { name: true } },
            setLogs: { where: { completed: true } },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (fullSession) {
      let sessionReps = 0;
      let sessionWeight = 0;
      for (const ex of fullSession.exercises) {
        for (const log of ex.setLogs) {
          if (log.reps != null) sessionReps += log.reps;
          if (log.reps != null && log.weight != null) {
            sessionWeight += log.reps * Number(log.weight);
          }
        }
      }

      lastWorkout = {
        id: fullSession.id,
        title: fullSession.title,
        category: fullSession.category,
        date: fullSession.date.toISOString(),
        exerciseCount: fullSession.exercises.length,
        exercises: fullSession.exercises.slice(0, 5).map((e) => e.exercise.name),
        totalReps: sessionReps,
        totalWeight: sessionWeight,
        startedAt: fullSession.startedAt?.toISOString() ?? null,
        endedAt: fullSession.endedAt?.toISOString() ?? null,
      };
    }
  }

  return NextResponse.json({
    totalSessions: sessions.length,
    totalReps,
    totalWeight: Math.round(totalWeight),
    totalSessionTimeSec: Math.round(totalSessionTimeSec),
    sessionsWithTime,
    lastWorkout,
  });
}
