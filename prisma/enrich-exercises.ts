/**
 * Enrich Train Heroic exercises with YouTube video IDs and instructions.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx prisma/enrich-exercises.ts
 *
 * This script finds exercises by name (case-insensitive) that do NOT already
 * have a youtubeId set, and updates them with curated video IDs and form cues.
 * It handles name aliases so "cable tricep push down" and "cable tricep
 * extension" both get the same enrichment data.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Enrichment Data ────────────────────────────────────────────────────────
// Each entry: primary name, optional aliases, youtubeId (null = intentionally
// no video), and brief instructions describing proper form.

interface EnrichmentEntry {
  /** Primary exercise name to match (case-insensitive). */
  names: string[];
  youtubeId: string | null;
  instructions: string;
}

const ENRICHMENTS: EnrichmentEntry[] = [
  // ─── Hips / Glutes ───
  {
    names: ["Hip Thrust"],
    youtubeId: "SEdqd1n0icg",
    instructions: `1. Sit on the floor with upper back against a bench, barbell over hips.
2. Drive through heels, squeezing glutes to lift hips until torso is parallel to the floor.
3. Pause at the top, then lower with control. Keep chin slightly tucked throughout.`,
  },
  {
    names: ["Single Leg Hip Thrust"],
    youtubeId: "SEdqd1n0icg",
    instructions: `1. Set up like a standard hip thrust but extend one leg straight out.
2. Drive through the planted heel, squeezing the glute to full hip extension.
3. Lower with control. Complete all reps on one side before switching.`,
  },
  {
    names: ["B Stance Hip Thrust"],
    youtubeId: "SEdqd1n0icg",
    instructions: `1. Set up like a hip thrust but stagger your feet—working leg flat, other foot on its heel for light support.
2. Drive primarily through the working leg, squeezing the glute at the top.
3. Lower with control. The staggered stance biases load to the front leg.`,
  },
  {
    names: ["Glute Med Hip Thrust"],
    youtubeId: "SEdqd1n0icg",
    instructions: `1. Set up for a hip thrust with a mini band around the knees.
2. As you thrust up, press knees outward against the band to activate the gluteus medius.
3. Hold at the top for a beat, then lower with control. Focus on the side-glute burn.`,
  },
  {
    names: ["Deficit Frog Pumps"],
    youtubeId: "iZFMBGfXxBQ",
    instructions: `1. Lie on a bench or elevated surface, soles of feet together and knees flared out (frog position).
2. Drive hips up by squeezing glutes, letting feet press together.
3. Lower hips below bench level for a stretch, then repeat. Keep core braced.`,
  },

  // ─── Pressing ───
  {
    names: ["Incline DB Bench Press", "Incline Dumbbell Bench Press"],
    youtubeId: "8iPEnn-ltC8",
    instructions: `1. Set bench to 30-45° incline. Press dumbbells from shoulder level to full lockout.
2. Lower with control until upper arms are roughly parallel to the floor.
3. Keep shoulder blades pinched and feet flat. Emphasizes upper chest.`,
  },
  {
    names: ["Seated DB Press", "Seated Dumbbell Press"],
    youtubeId: "qEwKCR5JCog",
    instructions: `1. Sit upright on a bench with back support, dumbbells at shoulder height.
2. Press overhead to full lockout, keeping core braced.
3. Lower with control to ear level. Avoid excessive arching of the lower back.`,
  },
  {
    names: ["DB Floor Press", "Dumbbell Floor Press"],
    youtubeId: "uUGDRwge4F8",
    instructions: `1. Lie on the floor with knees bent, pressing dumbbells from chest level.
2. Lower until triceps touch the floor, pause briefly, then press up.
3. The floor limits range of motion, making this easier on the shoulders.`,
  },
  {
    names: ["Overhead Press", "Barbell Overhead Press"],
    youtubeId: "QAQ64hK4Xxs",
    instructions: `1. Bar at collarbone height, grip just outside shoulders.
2. Brace core, squeeze glutes, and press the bar straight overhead.
3. Lock out with arms fully extended. Lower with control to collarbone.`,
  },
  {
    names: ["Push-Up", "Push Up", "Pushup"],
    youtubeId: "IODxDxX7oi4",
    instructions: `1. Hands slightly wider than shoulders, body in a straight plank line.
2. Lower chest to just above the floor, elbows at roughly 45°.
3. Press back up to full lockout. Keep core tight—no sagging hips.`,
  },

  // ─── Rows / Pulls ───
  {
    names: ["Seated Row", "Seated Cable Row"],
    youtubeId: "GZbfZ033f74",
    instructions: `1. Sit at cable row station, feet braced, slight bend in knees.
2. Pull handle to lower chest, squeezing shoulder blades together.
3. Extend arms with control. Keep torso upright—avoid rocking.`,
  },
  {
    names: ["Chest Supported Rows", "Chest Supported Row", "Chest Supported DB Row"],
    youtubeId: "H75im3p3Fhg",
    instructions: `1. Lie face-down on an incline bench (30-45°), dumbbells hanging at arm's length.
2. Row both dumbbells toward your hips, squeezing shoulder blades.
3. Lower with control. The bench support eliminates momentum and protects the lower back.`,
  },
  {
    names: ["Barbell Row"],
    youtubeId: "FWJR5Ve8bnQ",
    instructions: `1. Hinge forward with flat back, bar hanging at arm's length.
2. Pull bar to lower chest/upper abs, squeezing shoulder blades together.
3. Lower with control. Keep core braced and avoid rounding the back.`,
  },
  {
    names: ["Lat Pulldown"],
    youtubeId: "CAwf7n6Luuc",
    instructions: `1. Grip bar slightly wider than shoulders, sit with thighs locked under pad.
2. Pull bar to upper chest, driving elbows down and back.
3. Return with control to full stretch. Avoid leaning too far back.`,
  },
  {
    names: ["Wide Grip Pull Down", "Wide Grip Pulldown"],
    youtubeId: "CAwf7n6Luuc",
    instructions: `1. Take a wide overhand grip on the lat pulldown bar.
2. Pull to upper chest, focusing on squeezing lats and driving elbows wide.
3. Control the return to full arm extension. Keep torso fairly upright.`,
  },
  {
    names: ["Underhand Grip Pull Down", "Underhand Grip Pulldown", "Reverse Grip Pulldown"],
    youtubeId: "1LDxqj9_iEo",
    instructions: `1. Grip the lat pulldown bar with palms facing you, shoulder-width apart.
2. Pull to upper chest, focusing on biceps and lower lats.
3. Control the return. The supinated grip shifts emphasis to the lower lats and biceps.`,
  },
  {
    names: ["Pull-Up", "Pull Up", "Pullup"],
    youtubeId: "eGo4IYlbE5g",
    instructions: `1. Hang with overhand grip, hands slightly wider than shoulders.
2. Pull up until chin clears the bar, driving elbows down.
3. Lower with control to a full dead hang. Avoid swinging or kipping.`,
  },
  {
    names: ["Chin-Up", "Chin Up", "Chinup"],
    youtubeId: "brhRXlOhWVM",
    instructions: `1. Hang with underhand grip, hands shoulder-width apart.
2. Pull up until chin clears the bar, squeezing biceps and lats.
3. Lower with full control. More bicep emphasis than pull-ups.`,
  },
  {
    names: ["Bird Dog One Arm Row", "Bird Dog Row"],
    youtubeId: "H75im3p3Fhg",
    instructions: `1. Start in a bird-dog position on a bench—one hand and opposite knee on bench, other leg extended.
2. Row a dumbbell with the free hand toward your hip, squeezing the lat.
3. Lower with control. This variation challenges core stability along with back strength.`,
  },

  // ─── Chest Flyes ───
  {
    names: ["Incline Cable Fly", "Incline Cable Flye"],
    youtubeId: "Iwe6AmxVf7o",
    instructions: `1. Set cables low, bench at 30-45° incline. Hold handles with slight elbow bend.
2. Bring hands together in an arc over upper chest, squeezing pecs.
3. Lower with control, feeling a stretch across the chest. Maintain the elbow angle.`,
  },
  {
    names: ["Standing Cable Chest Fly", "Standing Cable Fly", "Cable Chest Fly"],
    youtubeId: "Iwe6AmxVf7o",
    instructions: `1. Set cables at shoulder height, step forward for tension.
2. Bring handles together in front of your chest in a hugging motion.
3. Return with control, feeling a stretch. Keep a slight bend in the elbows throughout.`,
  },

  // ─── Shoulders ───
  {
    names: ["Seated Lateral Raise", "Seated DB Lateral Raise"],
    youtubeId: "3VcKaXpzqRo",
    instructions: `1. Sit on a bench with dumbbells at your sides, slight elbow bend.
2. Raise arms out to the sides until parallel with the floor.
3. Lower with control. Sitting eliminates momentum for stricter form.`,
  },

  // ─── Arms ───
  {
    names: ["Cable Bicep Curl", "Cable Biceps Curl"],
    youtubeId: "NFzTWp2qpiE",
    instructions: `1. Stand facing a low cable with a straight or EZ bar attachment.
2. Curl the handle toward your shoulders, keeping elbows pinned at your sides.
3. Lower with control. Constant cable tension makes this great for bicep isolation.`,
  },
  {
    names: ["Barbell Bicep Curls", "Barbell Curl", "Barbell Bicep Curl"],
    youtubeId: "kwG2ipFRgFo",
    instructions: `1. Stand with barbell, underhand grip at shoulder width.
2. Curl the bar toward your shoulders, keeping elbows stationary.
3. Lower with control. Avoid swinging the torso—brace your core.`,
  },
  {
    names: ["Incline Dumbbell Curl", "Incline DB Curl"],
    youtubeId: "soxrZlIl35U",
    instructions: `1. Sit on an incline bench (45-60°), arms hanging straight down with dumbbells.
2. Curl toward shoulders, keeping upper arms stationary against the bench.
3. Lower with control. The incline pre-stretches the biceps for greater activation.`,
  },
  {
    names: [
      "Rope Overhead Tricep Extension",
      "Cable Overhead Tricep Extension",
      "Overhead Tricep Extension",
    ],
    youtubeId: "kiuVA0gs3EI",
    instructions: `1. Attach a rope to a low cable. Face away, arms overhead, elbows bent.
2. Extend arms overhead by straightening at the elbows, squeezing triceps.
3. Return with control. Keep upper arms close to your head throughout.`,
  },
  {
    names: [
      "Cable Tricep Push Down",
      "Cable Tricep Pushdown",
      "Cable Tricep Extension",
      "Tricep Pushdown",
    ],
    youtubeId: "2-LAMcpzODU",
    instructions: `1. Stand at a high cable with a straight bar or rope attachment.
2. Push the handle down by extending elbows, squeezing triceps at the bottom.
3. Return with control. Keep elbows pinned at your sides—don't flare them.`,
  },

  // ─── Legs ───
  {
    names: ["Romanian Deadlift", "RDL"],
    youtubeId: "7j-2w4-P14I",
    instructions: `1. Stand holding a barbell or dumbbells, slight knee bend.
2. Hinge at hips, pushing them back, lowering weight along your legs.
3. Feel the hamstring stretch, then drive hips forward to stand. Keep back flat.`,
  },
  {
    names: ["Leg Extension"],
    youtubeId: "YyvSfVjQeL0",
    instructions: `1. Sit in the leg extension machine, pad against lower shins.
2. Extend legs to full lockout, squeezing quads at the top.
3. Lower with control. Avoid using momentum—keep the movement smooth.`,
  },
  {
    names: ["Lying Leg Curl", "Prone Leg Curl"],
    youtubeId: "1Tq3QdYUuHs",
    instructions: `1. Lie face-down on the leg curl machine, pad just above your heels.
2. Curl heels toward glutes, squeezing hamstrings.
3. Lower with control. Avoid lifting your hips off the pad.`,
  },
  {
    names: ["Seated Hamstring Curl", "Seated Leg Curl"],
    youtubeId: "1Tq3QdYUuHs",
    instructions: `1. Sit in the machine with pad behind your lower legs, thighs secured.
2. Curl legs down and back, squeezing hamstrings at the bottom.
3. Return with control. Keep your back against the seat.`,
  },
  {
    names: ["Seated Leg Press", "Leg Press"],
    youtubeId: "IZxyjW7MPJQ",
    instructions: `1. Sit in the leg press with feet shoulder-width on the platform.
2. Lower the sled by bending knees toward chest (don't let lower back round).
3. Press through heels and mid-foot to extend legs. Don't fully lock out knees.`,
  },
  {
    names: ["Bulgarian Split Squat"],
    youtubeId: "2C-uNgKwPLE",
    instructions: `1. Rear foot elevated on a bench, front foot about 2 feet ahead.
2. Lower until front thigh is parallel, keeping torso upright.
3. Drive through the front heel to stand. Great for single-leg strength and balance.`,
  },
  {
    names: ["Dumbbell Goblet Split Squat", "Goblet Split Squat"],
    youtubeId: "DB7SZ0V2Yns",
    instructions: `1. Hold a dumbbell at chest height (goblet position), one foot forward.
2. Lower into a split squat until front thigh is parallel to the floor.
3. Press through the front heel to stand. Keep torso upright throughout.`,
  },
  {
    names: ["DB Reverse Lunge", "Dumbbell Reverse Lunge", "Barbell Reverse Lunge", "Reverse Lunge"],
    youtubeId: "xrPteyQLGAo",
    instructions: `1. Hold dumbbells at sides (or barbell on back). Step one foot backward.
2. Lower until both knees are at roughly 90°.
3. Drive through the front heel to return to standing. Alternate legs or complete one side.`,
  },
  {
    names: ["Walking Lunge", "Walking Lunges"],
    youtubeId: "L8fvypPH3SA",
    instructions: `1. Hold dumbbells at sides or barbell on back. Step forward into a lunge.
2. Lower until both knees are at 90°, then drive through the front foot to step into the next lunge.
3. Continue walking forward, alternating legs. Keep torso upright.`,
  },
  {
    names: ["Step-Ups", "Step Up", "Step-Up"],
    youtubeId: "dQqApCGd5Dg",
    instructions: `1. Stand facing a box or bench, one foot on top.
2. Drive through the elevated foot to step up, bringing the other foot to the top.
3. Step down with control. Minimize pushing off the bottom foot.`,
  },
  {
    names: ["Calf Raise", "Standing DB Calf Raise", "Standing Calf Raise"],
    youtubeId: "gwLzBJYoWlI",
    instructions: `1. Stand on a raised surface with heels hanging off the edge.
2. Rise onto the balls of your feet, squeezing calves at the top.
3. Lower heels below the platform for a full stretch. Use dumbbells for added resistance.`,
  },

  // ─── Deadlift Variations ───
  {
    names: ["Trap Bar Deadlift", "Hex Bar Deadlift"],
    youtubeId: "dd8m_bHLbCQ",
    instructions: `1. Stand inside the trap bar, feet hip-width, grip the handles.
2. Brace core, push through the floor, and stand up by extending hips and knees.
3. Lower with control. The neutral grip and centered load are easier on the lower back.`,
  },
  {
    names: ["Sumo Deadlift"],
    youtubeId: "jFnOEz8yXYk",
    instructions: `1. Wide stance with toes pointed out 45°, grip the bar inside your knees.
2. Push knees out, brace core, and drive through the floor to stand.
3. Lock out hips at the top. Lower with control. Emphasizes glutes and adductors.`,
  },

  // ─── Squat Variations ───
  {
    names: ["Safety Bar Squat", "SSB Squat"],
    youtubeId: "sAeLt3bfl0M",
    instructions: `1. Set the safety squat bar on your upper back, grip the front handles.
2. Brace core, descend to at least parallel by pushing hips back and bending knees.
3. Drive through heels to stand. The bar's camber shifts load forward, hitting quads and upper back.`,
  },

  // ─── Kettlebell ───
  {
    names: ["KB Swings", "Kettlebell Swing", "KB Swing", "Kettlebell Swings"],
    youtubeId: "YSxHifyI6s8",
    instructions: `1. Hinge at hips, grip the kettlebell with both hands.
2. Snap hips forward to swing the bell to chest/shoulder height.
3. Let it swing back between legs, hinging at hips. Power comes from the hips, not the arms.`,
  },
  {
    names: ["Kettlebell Deadlift", "KB Deadlift"],
    youtubeId: "YSxHifyI6s8",
    instructions: `1. Stand over kettlebell, feet hip-width, grip the handle with both hands.
2. Brace core, push through the floor, and stand by extending hips and knees.
3. Lower with control by hinging at the hips. Keep back flat throughout.`,
  },
  {
    names: ["Kettlebell Halo", "KB Halo"],
    youtubeId: "FXBnqGnN4EM",
    instructions: `1. Hold a kettlebell upside-down by the horns at chest height.
2. Circle it around your head in one direction, keeping it close to your head.
3. Reverse direction after a set number of reps. Engages shoulders, core, and grip.`,
  },

  // ─── Carries / Locomotion ───
  {
    names: [
      "Forward/Backwards Farmer's Walk",
      "Farmer's Walk",
      "Farmer Walk",
      "Single Arm Farmer Walk",
      "Farmers Walk",
      "Farmer's Carry",
    ],
    youtubeId: "Fkzk_RqlYig",
    instructions: `1. Pick up heavy dumbbells or kettlebells, one in each hand (or one for single arm).
2. Walk with tall posture, shoulders back, core braced.
3. Take controlled steps for distance or time. Great for grip, core, and overall stability.`,
  },
  {
    names: ["Bear Crawls", "Bear Crawl"],
    youtubeId: "kPmbUpGDkRo",
    instructions: `1. Start on all fours with knees hovering just above the ground.
2. Move forward by stepping opposite hand and foot simultaneously.
3. Keep hips low and back flat. Move slowly and with control for core activation.`,
  },

  // ─── Cardio / Conditioning ───
  {
    names: ["Run", "Running", "Treadmill Run"],
    youtubeId: null,
    instructions: `1. Maintain an upright posture with a slight forward lean.
2. Land with midfoot under your center of mass, arms swinging naturally.
3. Breathe rhythmically. Adjust pace to target heart rate zone.`,
  },
  {
    names: ["Stationary Bike", "Bike", "Exercise Bike"],
    youtubeId: null,
    instructions: `1. Adjust seat height so your knee has a slight bend at the bottom of the pedal stroke.
2. Pedal at a steady cadence, adjusting resistance to target intensity.
3. Keep upper body relaxed. Great for low-impact cardio and Zone 2 training.`,
  },
  {
    names: ["Rowing", "Rowing Machine", "Erg Row"],
    youtubeId: "zp5eANMhEz8",
    instructions: `1. Strap feet in, grip handle. Drive with legs first, then lean back slightly and pull to lower chest.
2. Reverse the sequence: extend arms, hinge forward, bend knees.
3. Maintain a steady rhythm. Focus on powerful leg drive—legs do most of the work.`,
  },

  // ─── Core / Stability ───
  {
    names: ["Copenhagen Side Plank", "Copenhagen Plank"],
    youtubeId: "1FPeYS1aMi4",
    instructions: `1. Lie on your side, top leg on a bench or elevated surface, bottom leg hanging free.
2. Lift hips to form a straight line from head to the elevated foot.
3. Hold for time. This intensely targets the adductors and obliques.`,
  },
  {
    names: ["Adductor Side Plank"],
    youtubeId: "1FPeYS1aMi4",
    instructions: `1. Lie on your side with the bottom leg on an elevated surface.
2. Press through the bottom leg to lift your hips, engaging the adductors.
3. Hold for time. Keep hips stacked and body in a straight line.`,
  },

  // ─── Mobility / Prehab ───
  {
    names: ["Foam Roller Thorasic Extension", "Foam Roller Thoracic Extension", "Thoracic Extension"],
    youtubeId: "SxQkWoGc6lQ",
    instructions: `1. Place a foam roller under your upper back, hands behind your head.
2. Gently extend over the roller, opening up the chest and thoracic spine.
3. Roll to different segments of the upper back. Breathe and relax into each position.`,
  },
  {
    names: ["Serratus Wall Slide", "Wall Slide"],
    youtubeId: "5rMiIxdsmBQ",
    instructions: `1. Stand with back and arms against a wall, elbows at 90°.
2. Slide arms overhead while keeping contact with the wall.
3. Lower with control. Focus on engaging the serratus anterior to keep shoulder blades flat.`,
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Enriching exercises with YouTube IDs and instructions...\n");

  let enrichedCount = 0;
  let skippedAlreadyHasVideo = 0;
  let notFoundNames: string[] = [];

  for (const entry of ENRICHMENTS) {
    // Try each name alias to find matching exercises
    let matchedAny = false;

    for (const name of entry.names) {
      // Find all exercises with this name (case-insensitive) that don't already have a youtubeId
      const exercises = await prisma.exercise.findMany({
        where: {
          name: { equals: name, mode: "insensitive" },
        },
      });

      if (exercises.length === 0) continue;
      matchedAny = true;

      for (const ex of exercises) {
        // Skip if exercise already has a youtubeId
        if (ex.youtubeId) {
          skippedAlreadyHasVideo++;
          continue;
        }

        await prisma.exercise.update({
          where: { id: ex.id },
          data: {
            youtubeId: entry.youtubeId,
            instructions: entry.instructions,
          },
        });

        enrichedCount++;
        console.log(`  Updated: "${ex.name}" (id: ${ex.id}) → youtubeId: ${entry.youtubeId ?? "(none)"}`);
      }
    }

    if (!matchedAny) {
      notFoundNames.push(entry.names.join(" / "));
    }
  }

  // ─── Summary ───
  console.log("\n── Summary ──────────────────────────────────");
  console.log(`  Exercises enriched:           ${enrichedCount}`);
  console.log(`  Skipped (already had video):  ${skippedAlreadyHasVideo}`);

  if (notFoundNames.length > 0) {
    console.log(`  Not found in database (${notFoundNames.length}):`);
    for (const n of notFoundNames) {
      console.log(`    - ${n}`);
    }
  }

  console.log("──────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("Error enriching exercises:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
