/**
 * Exercise ordering by scientific priority (Simão 2012, Ratamess 2009 NSCA Position Stand).
 *
 * Hierarchy:
 *   1. Multi-joint lower body (highest CNS demand, largest muscle mass)
 *   2. Multi-joint upper body (compound pressing/rowing)
 *   3. Compound bodyweight / moderate upper (pull-ups, cable rows)
 *   4. Isolation upper body (curls, flys, lateral raises, pushdowns)
 *   5. Isolation lower body / small (leg curls, calf raises)
 *   6. Cardio / metric / other (heart rate, runs, etc.)
 *
 * Within the same priority, original order is preserved (stable sort).
 */

// Priority 1: Multi-joint lower body compounds
const COMPOUND_LOWER: RegExp[] = [
  /\btrap bar deadlift\b/i,
  /\bbarbell deadlift\b/i,
  /\bdeadlift\b/i,
  /\bback squat\b/i,
  /\bbarbell squat\b/i,
  /\bfront squat\b/i,
  /\bsafety bar squat\b/i,
  /\bzercher squat\b/i,
  /\bhack squat\b/i,
  /\bsumo deadlift\b/i,
  /\bleg press\b/i,
  /\bseated leg press\b/i,
  /\bb stance hip thrust\b/i,
  /\bhip thrust\b/i,
  /\bglute.?med hip thrust\b/i,
  /\bsingle leg hip thrust\b/i,
  /\bbulgarian split squat\b/i,
  /\bgoblet bulgarian split squat\b/i,
  /\bdb bulgarian split squat\b/i,
  /\bgoblet squat\b/i,
  /\bdb squat\b/i,
  /\bheel elevated.*squat\b/i,
  /\bromanian deadlift\b/i,
  /\bdb romanian deadlift\b/i,
  /\bsingle leg.*deadlift\b/i,
  /\bkettlebell deadlift\b/i,
  /\bkettle bell deadlift\b/i,
  /\bbarbell.*lunge\b/i,
  /\bwalking lunge/i,
  /\blunge/i,
  /\bsplit squat\b/i,
  /\bstep.?up/i,
  /\bglute.?ham raise\b/i,
  /\bsled push\b/i,
  /\bkb swings?\b/i,
];

// Priority 2: Multi-joint upper body compounds
const COMPOUND_UPPER: RegExp[] = [
  /\bdb bench press\b/i,
  /\bbarbell bench press\b/i,
  /\bbench press\b/i,
  /\bincline db bench press\b/i,
  /\bincline bench press\b/i,
  /\bdecline bench press\b/i,
  /\bclose.?grip bench press\b/i,
  /\bdb chest press\b/i,
  /\bchest press\b/i,
  /\bmachine chest press\b/i,
  /\bseated chest press\b/i,
  /\bdb floor press\b/i,
  /\bbarbell row\b/i,
  /\bpendlay row\b/i,
  /\bt-bar row\b/i,
  /\bone arm db row\b/i,
  /\b1-arm db row\b/i,
  /\bdumbbell row\b/i,
  /\bchest supported row/i,
  /\bmeadows row\b/i,
  /\bseated.*row\b/i,
  /\bstanding db press\b/i,
  /\boverhead press\b/i,
  /\bbarbell overhead press\b/i,
  /\barnold press\b/i,
  /\bseated db press\b/i,
  /\bseated db shoulder press\b/i,
  /\bincline db shoulder press\b/i,
  /\blandmine press\b/i,
  /\bstanding landmine press\b/i,
  /\bhalf kneeling.*press\b/i,
  /\btall kneeling.*press\b/i,
  /\bdips?\b/i,
  /\bhigh to low cable chest press\b/i,
];

// Priority 3: Compound bodyweight / moderate upper
const COMPOUND_BW_UPPER: RegExp[] = [
  /\bchin.?up\b/i,
  /\bpull.?up\b/i,
  /\bparallel grip pull.?up\b/i,
  /\bwide grip pull.?up\b/i,
  /\bassisted.*pull.?up\b/i,
  /\bcable row\b/i,
  /\bhalf kneeling single arm pull down\b/i,
  /\bhalf kneeling.*row/i,
  /\blat pulldown\b/i,
  /\bneutral grip pull down\b/i,
  /\bwide.*pull down\b/i,
  /\bunderhand.*pull down\b/i,
  /\bseated.*pull down\b/i,
  /\bbilateral cable pull down\b/i,
  /\b1-arm cable pull down\b/i,
  /\bstraight arm pull\s?down\b/i,
  /\btrx row\b/i,
  /\bbird dog one arm row\b/i,
  /\bpush.?up\b/i,
  /\bhand release push\s?up\b/i,
  /\bdeficit push.?up\b/i,
  /\bweighted.*push.?up\b/i,
  /\bparallete push\s?up/i,
  /\bkneeling.*cable.*row\b/i,
  /\bbent over underhand grip.*row\b/i,
  /\bipsolateral.*row\b/i,
  /\bsingle arm.*row\b/i,
  /\b3-point one arm row\b/i,
];

// Priority 4: Isolation upper body
const ISOLATION_UPPER: RegExp[] = [
  /\bface pull\b/i,
  /\bcable fly\b/i,
  /\bcable.*chest fly\b/i,
  /\btraditional cable fly\b/i,
  /\blow to high cable fly\b/i,
  /\bincline cable fly\b/i,
  /\bhalf kneeling cable fly\b/i,
  /\bdb.*fly\b/i,
  /\bincline db chest fly\b/i,
  /\blateral raise\b/i,
  /\bdb lateral raise\b/i,
  /\bthumbs up lateral.*raise\b/i,
  /\bseated lateral raise\b/i,
  /\bcable rear delt/i,
  /\breverse cable crossover\b/i,
  /\breverse fly\b/i,
  /\bmachine reverse fly\b/i,
  /\bbent over db lateral raise\b/i,
  /\bband pull apart\b/i,
  /\bupright row\b/i,
  /\bdb front raise\b/i,
  /\bshrugs?\b/i,
  /\bshoulder shrugs?\b/i,
  /\bcurl\b/i,
  /\bbicep curl\b/i,
  /\bcable bicep curl\b/i,
  /\bincline dumbbell curl\b/i,
  /\bhammer curl\b/i,
  /\bbarbell curl\b/i,
  /\bbarbell bicep curl/i,
  /\bpreacher curl\b/i,
  /\bconcentration curl\b/i,
  /\bdb.*curl\b/i,
  /\bsingle arm cable bicep curl\b/i,
  /\btricep push\s?down\b/i,
  /\bcable tricep push\s?down\b/i,
  /\bcable tricep extension\b/i,
  /\bskull crusher/i,
  /\bdumbbell tricep skull crusher\b/i,
  /\boh tricep extension\b/i,
  /\bdb overhead tricep extension\b/i,
  /\brope overhead tricep extension\b/i,
  /\bcable overhead tricep extension\b/i,
  /\bsplit stance overhead tricep extension\b/i,
  /\beccentric bench dip/i,
  /\bkettlebell.*pullover\b/i,
  /\bpallof press\b/i,
  /\bcable woodchop\b/i,
  /\bcable crossover\b/i,
  /\bserratus wall slide\b/i,
];

// Priority 5: Isolation lower body / small
const ISOLATION_LOWER: RegExp[] = [
  /\blying leg curl\b/i,
  /\bleg curl\b/i,
  /\bseated hamstring curl\b/i,
  /\bslideboard hamstring curl\b/i,
  /\bstability ball hamstring curl\b/i,
  /\bpartner nordic hamstring curl\b/i,
  /\bleg extension\b/i,
  /\bcalf raise\b/i,
  /\bstanding db calf raise\b/i,
  /\bseated calf raise\b/i,
  /\bsissy squat\b/i,
  /\blateral step down\b/i,
  /\beccentric step down\b/i,
  /\bglute bridge\b/i,
  /\bheel elevated.*bridge\b/i,
  /\bdeficit frog pump/i,
  /\badductor/i,
  /\bab wheel/i,
  /\bcrunches/i,
  /\bhanging leg raise\b/i,
  /\brussian twist\b/i,
  /\bplank\b/i,
  /\bcopenhagen/i,
  /\bdead bug\b/i,
  /\bbeast position/i,
];

// Priority 6: Cardio / metric / mobility / other
const CARDIO_OTHER: RegExp[] = [
  /\brun\b/i,
  /\brunning\b/i,
  /\bzone 2/i,
  /\bthreshold/i,
  /\bcardio\b/i,
  /\bcycling\b/i,
  /\bstationary bike\b/i,
  /\belliptical\b/i,
  /\bswimming\b/i,
  /\bhiking\b/i,
  /\bwalk\b/i,
  /\browing\b/i,
  /\bski erg\b/i,
  /\bassault bike\b/i,
  /\bstair climber\b/i,
  /\bjump rope\b/i,
  /\bbattle ropes\b/i,
  /\bheart rate\b/i,
  /\baverage speed\b/i,
  /\bmat pilates\b/i,
  /\breformer pilates\b/i,
  /\bpilates/i,
  /\bmobility\b/i,
  /\bstretch/i,
  /\bfoam roll/i,
  /\bcat.?cow\b/i,
  /\bchild.?s pose\b/i,
  /\bpigeon pose\b/i,
  /\bspinal twist\b/i,
  /\bwrist mobility\b/i,
  /\bwrist curl/i,
  /\bnerve gliding/i,
  /\blacrosse ball/i,
  /\bkb arm bar\b/i,
  /\bkettlebell halo\b/i,
  /\bbear crawl/i,
  /\bbounding\b/i,
  /\bbox jump/i,
  /\bbroad jump/i,
  /\bdepth jump/i,
  /\btuck jump/i,
  /\bskater jump/i,
  /\blateral hop/i,
  /\bplyo/i,
];

// Check isolation lower BEFORE isolation upper so specific patterns like
// "Lying Leg Curl" match before the generic "\bcurl\b" in isolation upper.
const PRIORITY_GROUPS: [number, RegExp[]][] = [
  [1, COMPOUND_LOWER],
  [2, COMPOUND_UPPER],
  [3, COMPOUND_BW_UPPER],
  [5, ISOLATION_LOWER],
  [4, ISOLATION_UPPER],
  [6, CARDIO_OTHER],
];

/**
 * Returns a sort priority for an exercise (1 = highest priority / done first, 6 = lowest).
 * Unknown exercises default to priority 4 (isolation upper — safe middle ground).
 */
export function getExerciseSortPriority(exerciseName: string): number {
  for (const [priority, patterns] of PRIORITY_GROUPS) {
    for (const pattern of patterns) {
      if (pattern.test(exerciseName)) {
        return priority;
      }
    }
  }
  return 4; // default: treat unknown as isolation
}

/**
 * Sort exercises by scientific priority. Stable sort preserves original order
 * within the same priority tier.
 */
export function sortExercisesByPriority<T extends { exercise: { name: string } }>(
  exercises: T[]
): T[] {
  return [...exercises].sort((a, b) => {
    return getExerciseSortPriority(a.exercise.name) - getExerciseSortPriority(b.exercise.name);
  });
}

/**
 * Given a list of existing exercises and a new exercise name,
 * returns the correct insertion index to maintain priority ordering.
 */
export function getInsertionOrder(
  existingExercises: { exercise: { name: string } }[],
  newExerciseName: string
): number {
  const newPriority = getExerciseSortPriority(newExerciseName);
  const idx = existingExercises.findIndex(
    (e) => getExerciseSortPriority(e.exercise.name) > newPriority
  );
  return idx === -1 ? existingExercises.length : idx;
}
