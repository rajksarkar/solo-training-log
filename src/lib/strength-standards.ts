/**
 * Strength Level standards for the major barbell + machine lifts. Numbers
 * are 1RM in pounds for the 5 percentile bands Strength Level publishes:
 *
 *   Beginner    ≈  5th percentile
 *   Novice      ≈ 20th percentile
 *   Intermediate≈ 50th percentile (population average)
 *   Advanced    ≈ 80th percentile
 *   Elite       ≈ 95th percentile
 *
 * Values are drawn from strengthlevel.com/strength-standards/<lift>/lb,
 * age-adjusted to 50 and bodyweight-adjusted to 185 lb (the calibration
 * point). When called via `scaleBandsForBodyweight()`, bands are scaled
 * to the lifter's current bodyweight using the allometric strength-vs-BW
 * relationship (proportional to BW^0.67) — a well-established model
 * (Lietzke 1956, Lloyd 1989) that matches Strength Level's empirical
 * curves to within ~2% across a 165–205 lb range.
 *
 * Each `nameMatches` regex picks up Raj's variant naming in the DB.
 */

export type StrengthLevel = "Beginner" | "Novice" | "Intermediate" | "Advanced" | "Elite";

export interface LiftBands {
  Beginner: number;
  Novice: number;
  Intermediate: number;
  Advanced: number;
  Elite: number;
}

export interface LiftStandard {
  /** Display name shown in the UI. */
  name: string;
  /** Match against Exercise.name (case-insensitive trim). */
  nameMatches: RegExp;
  /** 1RM thresholds in lb, calibrated to a 50yo male at 185 lb. */
  bands: LiftBands;
  /** Optional explanatory note shown alongside the row. */
  note?: string;
}

/** Bodyweight the published bands are calibrated to. */
export const STANDARDS_REFERENCE_BW = 185;

export const STRENGTH_STANDARDS: LiftStandard[] = [
  // ─── The Big Three Barbell Lifts ───────────────────────────────────────
  {
    name: "Bench Press",
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
    // Conventional deadlift only — trap-bar has its own row.
    nameMatches: /^(barbell\s+)?deadlift$/i,
    bands: { Beginner: 153, Novice: 218, Intermediate: 297, Advanced: 389, Elite: 489 },
  },
  // ─── Other Barbell Lifts ──────────────────────────────────────────────
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
  {
    name: "Trap Bar Deadlift",
    nameMatches: /^(trap|hex)\s+bar\s+deadlift$/i,
    bands: { Beginner: 177, Novice: 244, Intermediate: 326, Advanced: 419, Elite: 519 },
    note: "Trap-bar standards include the bar (typically 66 lb).",
  },
  {
    name: "Romanian Deadlift",
    nameMatches: /^(barbell\s+)?(romanian\s+deadlift|rdl)$/i,
    bands: { Beginner: 107, Novice: 164, Intermediate: 235, Advanced: 320, Elite: 412 },
  },
  // ─── Glute / Posterior ────────────────────────────────────────────────
  {
    name: "Hip Thrust",
    nameMatches: /^(barbell\s+)?hip\s+thrust$/i,
    bands: { Beginner: 74, Novice: 148, Intermediate: 252, Advanced: 383, Elite: 534 },
  },
  // ─── Dumbbell ─────────────────────────────────────────────────────────
  {
    name: "DB Bench Press",
    nameMatches: /^(db|dumbbell)\s+(bench\s+press|chest\s+press)$/i,
    bands: { Beginner: 42, Novice: 70, Intermediate: 107, Advanced: 145, Elite: 188 },
    note: "Per-dumbbell weight (not combined).",
  },
  // ─── Machine / Cable ──────────────────────────────────────────────────
  {
    name: "Lat Pulldown",
    nameMatches: /^lat\s+pull\s*down$|^(wide\s+grip\s+|neutral\s+grip\s+)?(lat\s+)?pulldown$/i,
    bands: { Beginner: 71, Novice: 106, Intermediate: 151, Advanced: 203, Elite: 261 },
  },
  {
    name: "Leg Press",
    nameMatches: /^(seated\s+)?leg\s+press$/i,
    bands: { Beginner: 169, Novice: 286, Intermediate: 442, Advanced: 632, Elite: 844 },
    note: "Sled leg-press standards (machine weight only).",
  },
];

/**
 * Scale a band table to a given bodyweight using allometric strength
 * scaling: strength ∝ BW^0.67. Returns a new bands object — does not
 * mutate the input. Returns the input unchanged if bodyweight is null
 * or matches the reference bodyweight.
 */
export function scaleBandsForBodyweight(
  bands: LiftBands,
  bodyweightLb: number | null,
): LiftBands {
  if (bodyweightLb == null || bodyweightLb <= 0) return bands;
  if (Math.abs(bodyweightLb - STANDARDS_REFERENCE_BW) < 0.5) return bands;
  const factor = Math.pow(bodyweightLb / STANDARDS_REFERENCE_BW, 2 / 3);
  return {
    Beginner: Math.round(bands.Beginner * factor),
    Novice: Math.round(bands.Novice * factor),
    Intermediate: Math.round(bands.Intermediate * factor),
    Advanced: Math.round(bands.Advanced * factor),
    Elite: Math.round(bands.Elite * factor),
  };
}

/**
 * Classify a 1RM into a strength level. Returns the band the lifter has
 * met or exceeded. If below Beginner, returns "Untrained".
 */
export function classifyLevel(
  oneRM: number,
  bands: LiftBands,
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
 * 100 = at-or-above Elite. Linear interpolation between bands so the
 * marker lands meaningfully mid-band rather than snapping to boundaries.
 */
export function levelPosition(
  oneRM: number,
  bands: LiftBands,
): number {
  if (oneRM >= bands.Elite) return 100;
  if (oneRM <= 0) return 0;
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
