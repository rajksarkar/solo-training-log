/**
 * Strength Level standards for the major barbell lifts. Numbers are 1RM
 * in pounds for the 5 percentile bands Strength Level publishes:
 *
 *   Beginner    ≈  5th percentile (just starting / weak)
 *   Novice      ≈ 20th percentile (some experience)
 *   Intermediate≈ 50th percentile (average lifter)
 *   Advanced    ≈ 80th percentile (years of training)
 *   Elite       ≈ 95th percentile (competitive)
 *
 * Values are drawn from strengthlevel.com/strength-standards/<lift>/lb,
 * age-adjusted to 50 and bodyweight-adjusted to 185 lb — Raj's current
 * stats. If bodyweight or age changes meaningfully, refresh this table
 * by re-fetching from Strength Level (their "By Age" / "By Bodyweight"
 * tables for that lift).
 *
 * Each `nameMatches` regex picks up Raj's variant naming in the DB
 * (e.g. "DB Bench Press" maps to bench, but a paused/incline variant
 * is excluded so we compare apples-to-apples against the standards).
 */

export type StrengthLevel = "Beginner" | "Novice" | "Intermediate" | "Advanced" | "Elite";

export interface LiftStandard {
  /** Display name shown in the UI. */
  name: string;
  /** Match against Exercise.name (case-insensitive). Should match ONLY the
   *  flat-bar/standard variant of the lift the standards are calibrated to. */
  nameMatches: RegExp;
  /** 1RM thresholds in lb for each level. */
  bands: Record<StrengthLevel, number>;
}

export const STRENGTH_STANDARDS: LiftStandard[] = [
  {
    name: "Bench Press",
    // Match "Barbell Bench Press" or plain "Bench Press" — exclude incline/decline/DB.
    nameMatches: /^(barbell\s+)?bench\s+press$/i,
    bands: { Beginner: 92, Novice: 136, Intermediate: 192, Advanced: 258, Elite: 329 },
  },
  {
    name: "Back Squat",
    nameMatches: /^(barbell\s+)?(back\s+)?squat$/i,
    bands: { Beginner: 125, Novice: 182, Intermediate: 254, Advanced: 337, Elite: 428 },
  },
  {
    name: "Deadlift",
    // Standards are calibrated to conventional deadlift; trap-bar tends to
    // run heavier so we exclude it to avoid an inflated comparison.
    nameMatches: /^(barbell\s+)?deadlift$/i,
    bands: { Beginner: 153, Novice: 218, Intermediate: 297, Advanced: 389, Elite: 489 },
  },
  {
    name: "Overhead Press",
    nameMatches: /^(barbell\s+)?overhead\s+press$|^standing\s+press$|^(barbell\s+)?military\s+press$/i,
    bands: { Beginner: 75, Novice: 106, Intermediate: 145, Advanced: 189, Elite: 238 },
  },
  {
    name: "Barbell Row",
    nameMatches: /^barbell\s+row$|^bent\s+over\s+(barbell\s+)?row$/i,
    bands: { Beginner: 79, Novice: 118, Intermediate: 167, Advanced: 224, Elite: 286 },
  },
];

/**
 * Classify a 1RM into a strength level. Returns the band the lifter has
 * met or exceeded. If below Beginner, returns "Untrained".
 */
export function classifyLevel(
  oneRM: number,
  bands: Record<StrengthLevel, number>,
): StrengthLevel | "Untrained" {
  if (oneRM >= bands.Elite) return "Elite";
  if (oneRM >= bands.Advanced) return "Advanced";
  if (oneRM >= bands.Intermediate) return "Intermediate";
  if (oneRM >= bands.Novice) return "Novice";
  if (oneRM >= bands.Beginner) return "Beginner";
  return "Untrained";
}

/**
 * Position an e1RM on the 0-100 axis where 0 = below Beginner and
 * 100 = at-or-above Elite. Used for the band-bar visualization in the UI.
 */
export function levelPosition(
  oneRM: number,
  bands: Record<StrengthLevel, number>,
): number {
  if (oneRM >= bands.Elite) return 100;
  if (oneRM <= 0) return 0;
  // Linear interpolation between bands so the marker lands meaningfully
  // mid-band rather than snapping to band boundaries.
  const stops: Array<[number, number]> = [
    [0, 0],
    [bands.Beginner, 10],
    [bands.Novice, 30],
    [bands.Intermediate, 55],
    [bands.Advanced, 80],
    [bands.Elite, 100],
  ];
  for (let i = 1; i < stops.length; i++) {
    const [v1, p1] = stops[i - 1];
    const [v2, p2] = stops[i];
    if (oneRM <= v2) {
      const t = (oneRM - v1) / (v2 - v1);
      return p1 + t * (p2 - p1);
    }
  }
  return 100;
}
