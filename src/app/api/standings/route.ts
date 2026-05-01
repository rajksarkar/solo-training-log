import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  STRENGTH_STANDARDS,
  STANDARDS_REFERENCE_BW,
  classifyLevel,
  levelPosition,
  scaleBandsForBodyweight,
} from "@/lib/strength-standards";

/**
 * GET /api/standings
 *
 * Returns Raj's best estimated 1RM (Epley) per tracked lift over the
 * lookback window, alongside Strength Level percentile bands scaled to
 * his current bodyweight so the comparison stays accurate as he cuts.
 *
 * Query params:
 *   ?days=180  — how far back to scan (default 180 = ~6 months)
 */

const EPLEY_REP_CAP = 12; // Epley breaks down past ~12 reps; cap for safety.

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const daysParam = Number(searchParams.get("days") ?? "180");
  const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 730) : 180;

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  // Pull the most recent bodyweight log so the bands can be scaled to
  // the lifter's actual current weight, not the static reference.
  const recentBW = await prisma.bodyWeight.findFirst({
    where: { ownerId: session.user.id },
    orderBy: { date: "desc" },
    select: { weight: true, date: true },
  });
  const bodyweightLb = recentBW?.weight ?? null;

  // Pull every set Raj has logged in the window for the lifts we track.
  // Filtering by name pattern in JS keeps the regex flexibility from the
  // standards module.
  const setLogs = await prisma.setLog.findMany({
    where: {
      completed: true,
      sessionExercise: {
        session: {
          ownerId: session.user.id,
          date: { gte: since },
          category: { in: ["strength", "plyometrics"] },
        },
      },
      reps: { gt: 0, lte: EPLEY_REP_CAP },
      weight: { gt: 0 },
    },
    include: {
      sessionExercise: {
        include: {
          exercise: { select: { name: true } },
          session: { select: { id: true, date: true, title: true } },
        },
      },
    },
  });

  const standings = STRENGTH_STANDARDS.map((std) => {
    let bestE1RM = 0;
    let bestSet: {
      reps: number;
      weight: number;
      date: string;
      sessionId: string;
      sessionTitle: string;
    } | null = null;

    for (const log of setLogs) {
      const exName = log.sessionExercise.exercise.name;
      if (!std.nameMatches.test(exName.trim())) continue;
      const reps = log.reps ?? 0;
      const weight = log.weight == null ? 0 : Number(log.weight);
      if (reps <= 0 || weight <= 0) continue;
      const e1rm = weight * (1 + reps / 30);
      if (e1rm > bestE1RM) {
        bestE1RM = e1rm;
        bestSet = {
          reps,
          weight,
          date: log.sessionExercise.session.date.toISOString().slice(0, 10),
          sessionId: log.sessionExercise.session.id,
          sessionTitle: log.sessionExercise.session.title,
        };
      }
    }

    const e1rm = Math.round(bestE1RM);
    const scaledBands = scaleBandsForBodyweight(std.bands, bodyweightLb);
    return {
      name: std.name,
      note: std.note ?? null,
      bands: scaledBands,
      estimated1RM: e1rm > 0 ? e1rm : null,
      bestSet,
      level: e1rm > 0 ? classifyLevel(e1rm, scaledBands) : null,
      position: e1rm > 0 ? Math.round(levelPosition(e1rm, scaledBands)) : null,
    };
  });

  return NextResponse.json({
    days,
    profile: {
      sex: "male",
      age: 50,
      bodyweightLb,
      // What the published bands were calibrated to before scaling.
      referenceBodyweightLb: STANDARDS_REFERENCE_BW,
      source: "strengthlevel.com (50yo male, 185 lb baseline, scaled to current BW)",
    },
    standings,
  });
}
