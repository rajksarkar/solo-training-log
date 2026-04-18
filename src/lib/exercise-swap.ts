// Swap candidate scoring for exercise substitution.
// Based on strength-coach exercise selection hierarchy:
//  - Same movement pattern (plane of motion) matters more than raw muscle overlap.
//    Bench and OHP share chest/tri/delts but are NOT interchangeable.
//  - Primary (first-listed) muscle is weighted highest.
//  - Category is a hard filter (don't swap strength for cardio).

export type SwapExercise = {
  id: string;
  name: string;
  category: string;
  equipment: string[];
  muscles: string[];
};

export type SwapCandidate = SwapExercise & {
  score: number;
  reasons: string[];
};

const PATTERNS: Array<{ name: string; test: RegExp }> = [
  { name: "horizontal-push", test: /\b(bench|chest press|floor press|push.?ups?|dips?|fly|flye|crossover|pec deck)\b/i },
  { name: "vertical-push", test: /\b(overhead|ohp|military|shoulder press|arnold|push press|landmine press)\b/i },
  { name: "vertical-pull", test: /\b(pull.?ups?|chin.?ups?|pull.?down|pulldown|lat pull)\b/i },
  { name: "horizontal-pull", test: /\b(rows?|chest.?supported|t.?bar|inverted)\b/i },
  { name: "hinge", test: /\b(deadlift|rdl|romanian|good.?morning|hip thrust|hip hinge|pull.?through|kettlebell swings?|kb swings?|nordic)\b/i },
  { name: "squat", test: /\b(squat|leg press|hack)\b/i },
  { name: "lunge", test: /\b(lunge|split squat|step.?up|bulgarian)\b/i },
  { name: "knee-extension", test: /\b(leg extension|sissy squat)\b/i },
  { name: "knee-flexion", test: /\b(leg curl|hamstring curl)\b/i },
  { name: "calf", test: /\b(calf|heel raise)\b/i },
  { name: "curl", test: /\b(curl)\b/i },
  { name: "tricep-extension", test: /\b(tricep|pushdown|skull|overhead extension|kickback|close.?grip bench)\b/i },
  { name: "lateral-raise", test: /\b((lateral|side|front)\s+(shoulder\s+)?raise|lateral delt)\b/i },
  { name: "rear-delt", test: /\b(rear delt|face pull|reverse fly|band pull.?apart|pull apart)\b/i },
  { name: "shrug", test: /\bshrugs?\b/i },
  { name: "core-anti-ext", test: /\b(plank|dead.?bug|ab wheel|rollout|hollow)\b/i },
  { name: "core-anti-rot", test: /\b(pallof|anti.?rotation|woodchop|chop)\b/i },
  { name: "core-flexion", test: /\b(crunch|sit.?up|leg raise|v.?up)\b/i },
  // Fallback: stance-based "press" (Standing DB Press, Seated DB Press, Half
  // Kneeling Single Arm Press, etc.) — evaluated last so chest/overhead named
  // presses claim themselves first.
  { name: "vertical-push", test: /\b(standing|seated|half.?kneeling|tall.?kneeling|kneeling)\b.*\bpress\b/i },
];

function movementPattern(name: string): string | null {
  for (const p of PATTERNS) if (p.test.test(name)) return p.name;
  return null;
}

// Many exercises in the DB have empty `muscles` arrays, so we infer from the
// exercise name as a fallback / augmentation. Returned muscles use the same
// canonical tags as the DB: chest, back, shoulders, quads, hamstrings, biceps,
// triceps, glutes, calves, core.
const MUSCLE_RULES: Array<{ test: RegExp; muscles: string[] }> = [
  // Chest (bench / chest press / floor press / push-ups / dips / flys)
  { test: /\b(bench press|chest press|floor press|push.?ups?|dips?|pec|fly|flye|crossover)\b/i, muscles: ["chest", "triceps", "shoulders"] },
  { test: /\bincline\b.*\b(bench|press)\b/i, muscles: ["chest", "shoulders", "triceps"] },
  // Shoulders — explicit overhead / military / landmine / arnold
  { test: /\b(overhead press|ohp|military press|shoulder press|arnold|push press|landmine press)\b/i, muscles: ["shoulders", "triceps"] },
  { test: /\b((lateral|side|front)\s+(shoulder\s+)?raise|lateral delt|upright row)\b/i, muscles: ["shoulders"] },
  { test: /\b(face pull|rear delt|reverse fly|band pull.?apart|pull apart)\b/i, muscles: ["shoulders", "back"] },
  // Back
  { test: /\b(lat pull|pull.?down|pulldown|pull.?ups?|chin.?ups?)\b/i, muscles: ["back", "biceps"] },
  { test: /\b(rows?|inverted row|t.?bar|chest.?supported)\b/i, muscles: ["back", "biceps"] },
  { test: /\bshrugs?\b/i, muscles: ["back", "shoulders"] },
  // Posterior chain
  { test: /\b(deadlift|rdl|romanian|good.?morning)\b/i, muscles: ["hamstrings", "glutes", "back"] },
  { test: /\b(hip thrust|glute bridge|pull.?through|kettlebell swings?|kb swings?|frog pump)\b/i, muscles: ["glutes", "hamstrings"] },
  // Legs (squats / lunges / isolation)
  { test: /\b(back squat|front squat|goblet squat|zercher|hack squat|leg press)\b/i, muscles: ["quads", "glutes"] },
  { test: /\bsquat\b/i, muscles: ["quads", "glutes"] },
  { test: /\b(lunge|split squat|step.?up|step.?down|bulgarian)\b/i, muscles: ["quads", "glutes"] },
  { test: /\b(leg extension|sissy squat)\b/i, muscles: ["quads"] },
  { test: /\b(leg curl|hamstring curl|nordic)\b/i, muscles: ["hamstrings"] },
  { test: /\b(calf|heel raise)\b/i, muscles: ["calves"] },
  // Arms
  { test: /\b(tricep|pushdown|skull.?crush|close.?grip bench|kickback|overhead extension)\b/i, muscles: ["triceps"] },
  { test: /\b(bicep|preacher|hammer curl|concentration)\b/i, muscles: ["biceps"] },
  { test: /\bcurl\b/i, muscles: ["biceps"] },
  // Core
  { test: /\b(plank|crunch|crunches|sit.?ups?|ab wheel|rollout|hollow|dead.?bug|bird.?dog|pallof|woodchop|russian twist|leg raise|v.?ups?|mountain climber|bear crawls?)\b/i, muscles: ["core"] },
  // Fallback: stance-based presses (Standing DB Press, Seated DB Press, Half
  // Kneeling Single Arm Press, Upside Down KB Press, etc.) — placed after the
  // chest/overhead rules so they only catch the ambiguous residual.
  { test: /\b(standing|seated|half.?kneeling|tall.?kneeling|kneeling|single arm|one arm|kb|kettlebell|upside.?down)\b.*\bpress\b/i, muscles: ["shoulders", "triceps"] },
];

function inferMusclesFromName(name: string): string[] {
  const lower = name.toLowerCase();
  for (const rule of MUSCLE_RULES) {
    if (rule.test.test(lower)) return rule.muscles;
  }
  return [];
}

function toStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === "string").map((v) => v.toLowerCase());
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function normalizeExercise(e: {
  id: string;
  name: string;
  category: string;
  equipment?: unknown;
  muscles?: unknown;
}): SwapExercise {
  const dbMuscles = toStringArray(e.muscles);
  const muscles =
    dbMuscles.length > 0 ? dbMuscles : inferMusclesFromName(e.name);
  return {
    id: e.id,
    name: e.name,
    category: e.category,
    equipment: toStringArray(e.equipment),
    muscles,
  };
}

export function scoreSwap(source: SwapExercise, cand: SwapExercise): SwapCandidate | null {
  if (cand.id === source.id) return null;
  if (cand.category !== source.category) return null;

  const reasons: string[] = [];
  let score = 0;

  // Primary muscle match: +50
  const sourcePrimary = source.muscles[0];
  const candPrimary = cand.muscles[0];
  if (sourcePrimary && candPrimary && sourcePrimary === candPrimary) {
    score += 50;
    reasons.push(`Same primary muscle (${sourcePrimary})`);
  } else if (sourcePrimary && cand.muscles.includes(sourcePrimary)) {
    score += 25;
    reasons.push(`Hits ${sourcePrimary}`);
  }

  // Muscle overlap (Jaccard): up to +30
  const j = jaccard(source.muscles, cand.muscles);
  score += Math.round(j * 30);
  const shared = source.muscles.filter((m) => cand.muscles.includes(m));
  if (shared.length > 1) {
    reasons.push(`Overlap: ${shared.join(", ")}`);
  }

  // Movement pattern: +25 when matching, heavy penalty otherwise to prevent
  // bench-press <-> overhead-press style mis-swaps.
  const srcPattern = movementPattern(source.name);
  const candPattern = movementPattern(cand.name);
  if (srcPattern && candPattern) {
    if (srcPattern === candPattern) {
      score += 25;
      reasons.push(`Same pattern (${srcPattern.replace(/-/g, " ")})`);
    } else {
      score -= 30;
    }
  }

  // Equipment overlap: small nudge
  const equipOverlap = source.equipment.filter((x) => cand.equipment.includes(x));
  if (equipOverlap.length > 0) {
    score += 5;
  }

  // If we have nothing at all — no muscle signal AND no pattern signal — skip.
  // Otherwise keep even weak matches so every exercise has at least some options.
  if (score <= 0) return null;
  return { ...cand, score, reasons };
}

export function rankSwapCandidates(
  source: SwapExercise,
  pool: SwapExercise[],
  limit = 12
): SwapCandidate[] {
  const scored: SwapCandidate[] = [];
  for (const c of pool) {
    const s = scoreSwap(source, c);
    if (s) scored.push(s);
  }
  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  // Safety net: if the scorer returned nothing (e.g., a niche exercise with no
  // muscle metadata and no recognizable pattern like "Bear Crawl" or "Run"),
  // fall back to same-category candidates so the user always gets options.
  if (scored.length === 0) {
    return pool
      .filter((c) => c.id !== source.id && c.category === source.category)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit)
      .map((c) => ({ ...c, score: 1, reasons: ["Same category"] }));
  }

  return scored.slice(0, limit);
}
