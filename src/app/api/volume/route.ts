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

/** Format a Date as a Monday-of-week YYYY-MM-DD string. */
function mondayStr(d: Date): string {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;
}

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

  const responseMonday = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;

  // Pull a 5-week window so we can show a trailing-4-week tonnage trend
  // alongside the current week's full breakdown.
  const trendStart = new Date(monday);
  trendStart.setDate(monday.getDate() - 28);

  const sessions = await prisma.session.findMany({
    where: {
      ownerId: session.user.id,
      date: { gte: trendStart, lte: sunday },
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
  let totalTonnage = 0;
  let sessionsCompleted = 0;
  // Map of week-start (YYYY-MM-DD Monday) → tonnage, for the trend chart.
  const weeklyTonnage = new Map<string, number>();
  // Map of week-start → muscle → tonnage. Used to compute the trailing
  // 4-week average per muscle so the UI can show per-muscle deltas.
  const weeklyMuscleTonnage = new Map<string, Map<string, number>>();

  for (const sess of sessions) {
    if (!STRENGTH_CATEGORIES.has(sess.category)) continue;

    const sessWeek = mondayStr(new Date(sess.date));
    const isCurrentWeek = sessWeek === responseMonday;
    let sessionHasCompletedSets = false;

    for (const se of sess.exercises) {
      const rawMuscles = se.exercise.muscles as unknown;
      const muscles: string[] = Array.isArray(rawMuscles) ? rawMuscles : [];

      // A hard set is RPE >= 6 (RIR <= 4) — warm-ups don't drive hypertrophy.
      // Treat unrecorded RPE as a working set so legacy data isn't excluded.
      const hardSets = se.setLogs.filter((l) => {
        if (!l.completed) return false;
        if (l.rpe == null) return true;
        return Number(l.rpe) >= 6;
      });
      if (hardSets.length === 0) continue;

      // Tonnage = sum(reps × weight) over the working sets. Bodyweight or
      // unloaded reps still count zero — tonnage explicitly measures load.
      const exerciseTonnage = hardSets.reduce((acc, l) => {
        const reps = l.reps ?? 0;
        const weight = l.weight == null ? 0 : Number(l.weight);
        return acc + reps * weight;
      }, 0);

      // Always accumulate weekly tonnage (total + per-muscle) for the trend.
      weeklyTonnage.set(sessWeek, (weeklyTonnage.get(sessWeek) ?? 0) + exerciseTonnage);

      // Resolve per-exercise muscle credit, taking the max weight when
      // multiple raw muscles collapse to the same canonical group.
      const exerciseWeights = new Map<string, number>();
      muscles.forEach((rawMuscle, idx) => {
        const muscle = normalizeMuscle(rawMuscle);
        if (!muscle) return;
        const weight = idx === 0 ? PRIMARY_WEIGHT : SECONDARY_WEIGHT;
        const existing = exerciseWeights.get(muscle) ?? 0;
        if (weight > existing) exerciseWeights.set(muscle, weight);
      });

      let weekMuscleMap = weeklyMuscleTonnage.get(sessWeek);
      if (!weekMuscleMap) {
        weekMuscleMap = new Map<string, number>();
        weeklyMuscleTonnage.set(sessWeek, weekMuscleMap);
      }
      for (const [muscle, weight] of exerciseWeights) {
        weekMuscleMap.set(muscle, (weekMuscleMap.get(muscle) ?? 0) + exerciseTonnage * weight);
        if (isCurrentWeek) {
          muscleSets.set(muscle, (muscleSets.get(muscle) ?? 0) + hardSets.length * weight);
        }
      }

      if (isCurrentWeek) {
        sessionHasCompletedSets = true;
        totalSets += hardSets.length;
        totalTonnage += exerciseTonnage;
      }
    }

    if (isCurrentWeek && sessionHasCompletedSets) sessionsCompleted++;
  }

  // Compute trailing 4-week per-muscle averages from the prior weeks
  // (excludes current week so the comparison is "this week vs my baseline").
  const priorWeekKeys: string[] = [];
  for (let i = 4; i >= 1; i--) {
    const wk = new Date(monday);
    wk.setDate(monday.getDate() - i * 7);
    priorWeekKeys.push(mondayStr(wk));
  }

  const currentMuscleTonnage = weeklyMuscleTonnage.get(responseMonday) ?? new Map<string, number>();

  function trailingAvgFor(muscle: string): number | null {
    const observations = priorWeekKeys
      .map((wk) => weeklyMuscleTonnage.get(wk)?.get(muscle) ?? 0)
      .filter((v) => v > 0);
    if (observations.length === 0) return null;
    return observations.reduce((a, b) => a + b, 0) / observations.length;
  }

  // Build sorted result. Round set counts to 0.5 increments and tonnage
  // to whole pounds so the UI shows clean values.
  const byMuscle = Array.from(muscleSets.entries())
    .map(([muscle, sets]) => {
      const tonnage = Math.round(currentMuscleTonnage.get(muscle) ?? 0);
      const trailingAvg = trailingAvgFor(muscle);
      const tonnageDeltaPct = trailingAvg != null && trailingAvg > 0
        ? Math.round(((tonnage - trailingAvg) / trailingAvg) * 100)
        : null;
      return {
        muscle,
        sets: Math.round(sets * 2) / 2,
        tonnage,
        trailingAvgTonnage: trailingAvg != null ? Math.round(trailingAvg) : null,
        tonnageDeltaPct,
      };
    })
    .sort((a, b) => b.sets - a.sets);

  // Build trailing trend with one entry per week, including weeks with
  // zero tonnage so the chart preserves time spacing.
  const tonnageTrend: { week: string; tonnage: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const wk = new Date(monday);
    wk.setDate(monday.getDate() - i * 7);
    const wkStr = mondayStr(wk);
    tonnageTrend.push({
      week: wkStr,
      tonnage: Math.round(weeklyTonnage.get(wkStr) ?? 0),
    });
  }

  return NextResponse.json({
    week: responseMonday,
    sessionsCompleted,
    totalSets,
    totalTonnage: Math.round(totalTonnage),
    byMuscle,
    tonnageTrend,
  });
}
