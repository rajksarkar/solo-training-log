import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Map common muscle name variations to canonical names. */
function normalizeMuscle(raw: string): string | null {
  const m = raw.toLowerCase().trim();

  // Skip overly granular muscles
  if (m === "forearms") return null;

  // Map variations to canonical names
  if (m === "lats" || m === "traps" || m === "upper back" || m === "lower back" || m === "rhomboids") return "back";
  if (m === "quadriceps") return "quads";
  if (m === "rear delts" || m === "front delts" || m === "side delts" || m === "lateral delts" || m === "anterior delts" || m === "posterior delts" || m === "deltoids" || m === "delts") return "shoulders";
  if (m === "abs" || m === "obliques" || m === "abdominals") return "core";
  if (m === "pecs" || m === "pectorals" || m === "upper chest" || m === "lower chest") return "chest";
  if (m === "hams") return "hamstrings";
  if (m === "glute" || m === "gluteus maximus" || m === "gluteus medius") return "glutes";

  // Return as-is if it's already a known canonical name
  const known = ["chest", "back", "shoulders", "quads", "hamstrings", "biceps", "triceps", "glutes", "calves", "core"];
  if (known.includes(m)) return m;

  // Unknown muscle — still return it so it shows up
  return m;
}

const STRENGTH_CATEGORIES = new Set(["strength", "plyometrics"]);

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekParam = searchParams.get("week");

  // Calculate Monday of the requested week (or current week)
  let monday: Date;
  if (weekParam) {
    monday = new Date(weekParam + "T00:00:00");
  } else {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday = new Date(now);
    monday.setDate(now.getDate() + diff);
  }
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Format Monday as YYYY-MM-DD for the response
  const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;

  // Query all sessions for the week with exercises, set logs, and exercise data
  const sessions = await prisma.session.findMany({
    where: {
      ownerId: session.user.id,
      date: { gte: monday, lte: sunday },
    },
    include: {
      exercises: {
        include: {
          exercise: true,
          setLogs: true,
        },
      },
    },
  });

  // Fractional set credit per muscle (Renaissance Periodization model):
  // - Primary mover (first muscle on the exercise) gets full credit (1.0x)
  // - Secondary movers (remaining muscles) get half credit (0.5x)
  // This avoids over-attributing triceps/shoulders volume from every bench press.
  const PRIMARY_WEIGHT = 1.0;
  const SECONDARY_WEIGHT = 0.5;

  const muscleSets = new Map<string, number>();
  let totalSets = 0;
  let sessionsCompleted = 0;

  for (const sess of sessions) {
    // Only count strength/plyometrics sessions
    if (!STRENGTH_CATEGORIES.has(sess.category)) continue;

    let sessionHasCompletedSets = false;

    for (const se of sess.exercises) {
      // Get muscles from the exercise definition
      const rawMuscles = se.exercise.muscles as unknown;
      const muscles: string[] = Array.isArray(rawMuscles) ? rawMuscles : [];

      // Count completed "hard sets" for this exercise.
      // A hard set is RPE >= 6 (RIR <= 4) — warm-ups don't drive hypertrophy.
      // Treat unrecorded RPE as a working set so legacy data isn't excluded.
      const completedCount = se.setLogs.filter((l) => {
        if (!l.completed) return false;
        if (l.rpe == null) return true;
        return Number(l.rpe) >= 6;
      }).length;
      if (completedCount === 0) continue;

      sessionHasCompletedSets = true;
      totalSets += completedCount;

      // Resolve per-exercise muscle credit, taking the max weight when
      // multiple raw muscles collapse to the same canonical group
      // (e.g. "lats" + "rhomboids" both → "back" — credit the back once
      // at primary weight, not 1.0 + 0.5).
      const exerciseWeights = new Map<string, number>();
      muscles.forEach((rawMuscle, idx) => {
        const muscle = normalizeMuscle(rawMuscle);
        if (!muscle) return;
        const weight = idx === 0 ? PRIMARY_WEIGHT : SECONDARY_WEIGHT;
        const existing = exerciseWeights.get(muscle) ?? 0;
        if (weight > existing) exerciseWeights.set(muscle, weight);
      });

      for (const [muscle, weight] of exerciseWeights) {
        muscleSets.set(
          muscle,
          (muscleSets.get(muscle) ?? 0) + completedCount * weight,
        );
      }
    }

    if (sessionHasCompletedSets) {
      sessionsCompleted++;
    }
  }

  // Build sorted result. Round to 0.5 increments so the UI shows clean
  // values like 7, 7.5, 11 instead of binary-fp noise.
  const byMuscle = Array.from(muscleSets.entries())
    .map(([muscle, sets]) => ({ muscle, sets: Math.round(sets * 2) / 2 }))
    .sort((a, b) => b.sets - a.sets);

  return NextResponse.json({
    week: mondayStr,
    sessionsCompleted,
    totalSets,
    byMuscle,
  });
}
