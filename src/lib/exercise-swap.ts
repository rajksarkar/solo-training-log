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
  { name: "vertical-push", test: /\b(overhead|ohp|military|shoulder press|arnold|push press|landmine press)\b/i },
  { name: "horizontal-push", test: /\b(bench|chest press|push.?up|pushup|dip|fly|flye|crossover|pec deck)\b/i },
  { name: "vertical-pull", test: /\b(pull.?up|chin.?up|pulldown|lat pull)\b/i },
  { name: "horizontal-pull", test: /\b(row|chest.?supported|t.?bar|inverted)\b/i },
  { name: "hinge", test: /\b(deadlift|rdl|romanian|good.?morning|hip thrust|hip hinge|pull.?through|kettlebell swing|nordic)\b/i },
  { name: "squat", test: /\b(squat|leg press|hack)\b/i },
  { name: "lunge", test: /\b(lunge|split squat|step.?up|bulgarian)\b/i },
  { name: "knee-extension", test: /\b(leg extension|sissy squat)\b/i },
  { name: "knee-flexion", test: /\b(leg curl|hamstring curl)\b/i },
  { name: "calf", test: /\b(calf|heel raise)\b/i },
  { name: "curl", test: /\b(curl)\b/i },
  { name: "tricep-extension", test: /\b(tricep|pushdown|skull|overhead extension|kickback|close.?grip bench)\b/i },
  { name: "lateral-raise", test: /\b(lateral raise|side raise|lateral delt)\b/i },
  { name: "rear-delt", test: /\b(rear delt|face pull|reverse fly)\b/i },
  { name: "shrug", test: /\b(shrug)\b/i },
  { name: "core-anti-ext", test: /\b(plank|dead.?bug|ab wheel|rollout|hollow)\b/i },
  { name: "core-anti-rot", test: /\b(pallof|anti.?rotation|woodchop|chop)\b/i },
  { name: "core-flexion", test: /\b(crunch|sit.?up|leg raise|v.?up)\b/i },
];

function movementPattern(name: string): string | null {
  for (const p of PATTERNS) if (p.test.test(name)) return p.name;
  return null;
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
  return {
    id: e.id,
    name: e.name,
    category: e.category,
    equipment: toStringArray(e.equipment),
    muscles: toStringArray(e.muscles),
  };
}

export function scoreSwap(source: SwapExercise, cand: SwapExercise): SwapCandidate | null {
  if (cand.id === source.id) return null;
  if (cand.category !== source.category) return null;
  if (cand.muscles.length === 0 || source.muscles.length === 0) return null;

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

  // Movement pattern: +20 when matching, heavy penalty otherwise to prevent
  // bench-press <-> overhead-press style mis-swaps.
  const srcPattern = movementPattern(source.name);
  const candPattern = movementPattern(cand.name);
  if (srcPattern && candPattern) {
    if (srcPattern === candPattern) {
      score += 20;
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
  return scored.slice(0, limit);
}
