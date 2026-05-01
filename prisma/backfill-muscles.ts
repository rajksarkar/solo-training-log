/**
 * Backfill `Exercise.muscles` for exercises imported without muscle tags.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx prisma/backfill-muscles.ts
 *
 * The volume API (`/api/volume`) attributes set credit to muscle groups using
 * the primary mover (first entry, 1.0x credit) and secondary movers (remaining
 * entries, 0.5x credit). When `muscles` is empty, sets are counted toward the
 * weekly total but not toward any muscle group — so the per-muscle breakdown
 * undercounts. This script populates muscles (primary first) for the 152
 * strength exercises imported from Train Heroic with empty muscles arrays.
 *
 * The vocabulary matches the existing data: `quadriceps`, `lats`, `rhomboids`,
 * `chest`, `triceps`, `shoulders`, `biceps`, `glutes`, `hamstrings`, `calves`,
 * `lower back`, `core`, `obliques`, `adductors`, `forearms`, `traps`,
 * `rear delts`. The volume route's `normalizeMuscle` collapses these into
 * canonical groups (e.g., lats/rhomboids/traps → back).
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MuscleAssignment {
  names: string[];
  muscles: string[];
}

const ASSIGNMENTS: MuscleAssignment[] = [
  // ─── Pulling / Back ─────────────────────────────────────────────────────
  { names: ["1-arm Cable Pull Down"], muscles: ["lats", "biceps", "rhomboids"] },
  { names: ["1-Arm DB Row"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["3-point one arm row"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["Alternating Dumbbell Rows"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["Assisted Wide Grip Pull Up"], muscles: ["lats", "biceps", "rhomboids"] },
  { names: ["Bent Over Underhand Grip Bar Cable Row"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["Bilateral Cable Pull Down"], muscles: ["lats", "biceps", "rhomboids"] },
  { names: ["Chest Supported Rows"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["Half Kneeling One Arm Row + Rotation"], muscles: ["lats", "rhomboids", "biceps", "core"] },
  { names: ["Half Kneeling Single Arm Pull Down"], muscles: ["lats", "biceps", "rhomboids"] },
  { names: ["Half Kneeling Single Arm Row + Reach"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["Ipsolateral Single Arm Dumbbell Row"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["Kettlebell Lat Pullover"], muscles: ["lats"] },
  { names: ["Kneeling Low to high One Arm Cable Row"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["Neutral Grip Pull Down"], muscles: ["lats", "biceps", "rhomboids"] },
  { names: ["One Arm DB Row"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["parallel grip pull up"], muscles: ["lats", "biceps", "rhomboids"] },
  { names: ["Prone Arm Row"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["Seated Bilateral Cable Pull Down"], muscles: ["lats", "biceps", "rhomboids"] },
  { names: ["Seated Row"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["Seated Single Arm Cable Pull Down"], muscles: ["lats", "biceps", "rhomboids"] },
  { names: ["Seated Underhand Grip Row"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["Single Arm Chest Supported Row"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["Straight Arm Pull Down (straight bar)"], muscles: ["lats"] },
  { names: ["Straight Arm Pulldown"], muscles: ["lats"] },
  { names: ["TRX Row"], muscles: ["lats", "rhomboids", "biceps"] },
  { names: ["Underhand Grip Pull Down"], muscles: ["lats", "biceps", "rhomboids"] },
  { names: ["Underhand Modified Grip Pull Down"], muscles: ["lats", "biceps", "rhomboids"] },
  { names: ["Wide Grip Pull Down"], muscles: ["lats", "biceps", "rhomboids"] },
  { names: ["Wide Grip Pull Up"], muscles: ["lats", "biceps", "rhomboids"] },
  { names: ["Wide Neutral Grip Pull Down"], muscles: ["lats", "biceps", "rhomboids"] },
  { names: ["Band Pull Apart"], muscles: ["rhomboids", "rear delts"] },
  { names: ["Shoulder Shrugs"], muscles: ["traps"] },

  // ─── Pressing / Chest ───────────────────────────────────────────────────
  { names: ["Barbell Bench Press"], muscles: ["chest", "triceps", "shoulders"] },
  { names: ["Barbell Incline Bench Press"], muscles: ["chest", "triceps", "shoulders"] },
  { names: ["Chest Press"], muscles: ["chest", "triceps", "shoulders"] },
  { names: ["DB Chest Press"], muscles: ["chest", "triceps", "shoulders"] },
  { names: ["DB Floor Press"], muscles: ["chest", "triceps"] },
  { names: ["DB Incline Fly"], muscles: ["chest"] },
  { names: ["Deficit Push Up"], muscles: ["chest", "triceps", "shoulders"] },
  { names: ["Deficit Yoga Pushups"], muscles: ["chest", "triceps", "shoulders", "core"] },
  { names: ["Eccentric Bench Dips"], muscles: ["triceps", "chest"] },
  { names: ["Eccentric Push-Up"], muscles: ["chest", "triceps", "shoulders"] },
  { names: ["Feet on Wall Floor Press"], muscles: ["chest", "triceps"] },
  { names: ["Half Kneeling Cable Fly"], muscles: ["chest"] },
  { names: ["Hand Release Pushup"], muscles: ["chest", "triceps", "shoulders"] },
  { names: ["High to Low Cable chest Fly"], muscles: ["chest"] },
  { names: ["High to Low Cable Chest Press"], muscles: ["chest", "triceps", "shoulders"] },
  { names: ["Incline Cable Fly"], muscles: ["chest"] },
  { names: ["Incline DB Bench Press"], muscles: ["chest", "triceps", "shoulders"] },
  { names: ["Incline DB Chest Fly"], muscles: ["chest"] },
  { names: ["Kneeling Cable Chest Fly"], muscles: ["chest"] },
  { names: ["Low to High Cable Fly"], muscles: ["chest"] },
  { names: ["Parallete Pushups"], muscles: ["chest", "triceps", "shoulders"] },
  { names: ["Reverse Cable Crossover"], muscles: ["rear delts", "rhomboids"] },
  { names: ["Seated Cable Chest Fly"], muscles: ["chest"] },
  { names: ["Seated Chest Press"], muscles: ["chest", "triceps", "shoulders"] },
  { names: ["Standing Cable Chest Fly"], muscles: ["chest"] },
  { names: ["Traditional Cable Fly"], muscles: ["chest"] },
  { names: ["Weighted Eccentric Push-Up"], muscles: ["chest", "triceps", "shoulders"] },

  // ─── Shoulders ──────────────────────────────────────────────────────────
  { names: ["Barbell Overhead Press"], muscles: ["shoulders", "triceps"] },
  { names: ["Bent Over DB Lateral Raise"], muscles: ["rear delts", "shoulders"] },
  { names: ["DB Front Raise"], muscles: ["shoulders"] },
  { names: ["DB Lateral Raise"], muscles: ["shoulders"] },
  { names: ["Half Kneeling DB Overhead Press"], muscles: ["shoulders", "triceps"] },
  { names: ["Half Kneeling Landmine Shoulder Press"], muscles: ["shoulders", "triceps"] },
  { names: ["Half Kneeling Single Arm Press"], muscles: ["shoulders", "triceps"] },
  { names: ["Half Kneeling Upside Down KB Press"], muscles: ["shoulders", "triceps", "core"] },
  { names: ["Incline DB Shoulder Press"], muscles: ["shoulders", "triceps"] },
  { names: ["Machine reverse fly"], muscles: ["rear delts", "rhomboids"] },
  { names: ["cable rear delt single arm raise"], muscles: ["rear delts"] },
  { names: ["Seated DB Press"], muscles: ["shoulders", "triceps"] },
  { names: ["Seated DB Shoulder Press"], muscles: ["shoulders", "triceps"] },
  { names: ["Seated Lateral Raise"], muscles: ["shoulders"] },
  { names: ["Standing DB Press"], muscles: ["shoulders", "triceps"] },
  { names: ["Standing Landmine Press"], muscles: ["shoulders", "triceps"] },
  { names: ["Tall Kneeling Arnold Press"], muscles: ["shoulders", "triceps"] },
  { names: ["Tall Kneeling Landmine Press"], muscles: ["shoulders", "triceps"] },
  { names: ["Thumbs Up Lateral Shoulder Raise"], muscles: ["shoulders"] },

  // ─── Biceps ─────────────────────────────────────────────────────────────
  { names: ["Alternating DB Hammer Curl"], muscles: ["biceps", "forearms"] },
  { names: ["Barbell Bicep Curls"], muscles: ["biceps"] },
  { names: ["Barbell Curl"], muscles: ["biceps"] },
  { names: ["Cable Bicep Curl"], muscles: ["biceps"] },
  { names: ["DB Bicep Curls"], muscles: ["biceps"] },
  { names: ["Incline Dumbbell Curl"], muscles: ["biceps"] },
  { names: ["Seated DB Curl"], muscles: ["biceps"] },
  { names: ["Single Arm Cable Bicep Curl"], muscles: ["biceps"] },
  { names: ["Single Arm Preacher Curl"], muscles: ["biceps"] },

  // ─── Triceps ────────────────────────────────────────────────────────────
  { names: ["Cable Overhead Tricep Extension"], muscles: ["triceps"] },
  { names: ["cable tricep extension"], muscles: ["triceps"] },
  { names: ["cable tricep push down"], muscles: ["triceps"] },
  { names: ["DB Overhead Tricep Extension"], muscles: ["triceps"] },
  { names: ["Dumbbell tricep skull crusher"], muscles: ["triceps"] },
  { names: ["Rope Overhead Tricep Extension"], muscles: ["triceps"] },
  { names: ["Split Stance Overhead Tricep Extension"], muscles: ["triceps"] },

  // ─── Squats / Quads ─────────────────────────────────────────────────────
  { names: ["Barbell Back Squat"], muscles: ["quadriceps", "glutes", "hamstrings", "core"] },
  { names: ["Barbell Reverse Lunge"], muscles: ["quadriceps", "glutes", "hamstrings"] },
  { names: ["Barbell Split Squat"], muscles: ["quadriceps", "glutes", "hamstrings"] },
  { names: ["Barbell Squat to Bench"], muscles: ["quadriceps", "glutes", "hamstrings"] },
  { names: ["Cross Body Cable Split Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["DB Bulgarian Split Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["DB Reverse Lunge"], muscles: ["quadriceps", "glutes", "hamstrings"] },
  { names: ["DB Split Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["DB Squat"], muscles: ["quadriceps", "glutes", "hamstrings"] },
  { names: ["Deficit Curtsy Lunge"], muscles: ["quadriceps", "glutes"] },
  { names: ["Dumbbell Goblet Split Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Dumbbell Step Up"], muscles: ["quadriceps", "glutes"] },
  { names: ["Eccentric Dumbbell Goblet Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Eccentric Step Down"], muscles: ["quadriceps", "glutes"] },
  { names: ["Feet Elevated Dumbbell Goblet Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Front Foot DB Split Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Front Foot Elevated Barbell Zercher Split Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Front Foot Elevated KB Split Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Goblet Bulgarian Split Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Hand Supported Bulgarian Split Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Heel Elevated DB Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Isometric Split Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Lateral Step Down"], muscles: ["quadriceps", "glutes"] },
  { names: ["Low to High Cable Split Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Safety Bar Rack Assisted Split Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Safety Bar Squat"], muscles: ["quadriceps", "glutes", "hamstrings"] },
  { names: ["slide board  lateral lunge"], muscles: ["quadriceps", "glutes", "adductors"] },
  { names: ["TRX Single Leg Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Try Single Leg Squat"], muscles: ["quadriceps", "glutes"] },
  { names: ["Seated Leg Press"], muscles: ["quadriceps", "glutes", "hamstrings"] },

  // ─── Hamstrings / Posterior Chain ───────────────────────────────────────
  { names: ["Barbell Deadlift"], muscles: ["hamstrings", "glutes", "lower back", "lats"] },
  { names: ["DB Romanian Deadlift"], muscles: ["hamstrings", "glutes", "lower back"] },
  { names: ["Hand Supported Ipsolateral Singe Leg Deadlift"], muscles: ["hamstrings", "glutes"] },
  { names: ["Kettle Bell Deadlift"], muscles: ["hamstrings", "glutes", "lower back"] },
  { names: ["Kettlebell Deadlift"], muscles: ["hamstrings", "glutes", "lower back"] },
  { names: ["KB swings"], muscles: ["glutes", "hamstrings", "core"] },
  { names: ["Lying Leg Curl"], muscles: ["hamstrings"] },
  { names: ["Partner Nordic Hamstring Curl"], muscles: ["hamstrings"] },
  { names: ["Seated Hamstring Curl"], muscles: ["hamstrings"] },
  { names: ["Single Leg Dumbbell Deadlift"], muscles: ["hamstrings", "glutes"] },
  { names: ["Single Leg KB Deadlift"], muscles: ["hamstrings", "glutes"] },
  { names: ["Slideboard Hamstring Curl"], muscles: ["hamstrings"] },
  { names: ["Stability Ball Hamstring Curl"], muscles: ["hamstrings"] },
  { names: ["Trap Bar Deadlift"], muscles: ["quadriceps", "glutes", "hamstrings", "lower back"] },

  // ─── Glutes ─────────────────────────────────────────────────────────────
  { names: ["B Stance Hip Thrust"], muscles: ["glutes", "hamstrings"] },
  { names: ["Contralateral Single Leg Glute Bridge Press"], muscles: ["glutes"] },
  { names: ["Deficit Frog Pumps"], muscles: ["glutes"] },
  { names: ["Glute Med Hip Thrust"], muscles: ["glutes"] },
  { names: ["Heel Elevated Glute Bridge"], muscles: ["glutes"] },
  { names: ["Heel Elevated Single Leg Glute Bridge"], muscles: ["glutes"] },
  { names: ["Side Lying Hip Raise"], muscles: ["glutes"] },
  { names: ["Single Leg Glute Bridge On Ball"], muscles: ["glutes", "hamstrings"] },
  { names: ["Single Leg Hip Thrust"], muscles: ["glutes", "hamstrings"] },

  // ─── Calves ─────────────────────────────────────────────────────────────
  { names: ["Standing DB Calf Raise"], muscles: ["calves"] },

  // ─── Core ───────────────────────────────────────────────────────────────
  { names: ["Adductor Side Plank"], muscles: ["adductors", "core", "obliques"] },
  { names: ["Copenhagen Side Plank"], muscles: ["adductors", "core", "obliques"] },
  { names: ["Dumbbell Roll Back"], muscles: ["core"] },
];

async function main() {
  console.log("Backfilling muscles for exercises with empty muscles arrays...\n");

  let updatedCount = 0;
  let skippedAlreadyHasMuscles = 0;
  const notFoundNames: string[] = [];

  for (const entry of ASSIGNMENTS) {
    let matchedAny = false;

    for (const name of entry.names) {
      const exercises = await prisma.exercise.findMany({
        where: { name: { equals: name, mode: "insensitive" } },
      });

      if (exercises.length === 0) continue;
      matchedAny = true;

      for (const ex of exercises) {
        const current = Array.isArray(ex.muscles) ? (ex.muscles as unknown[]) : [];
        if (current.length > 0) {
          skippedAlreadyHasMuscles++;
          continue;
        }

        await prisma.exercise.update({
          where: { id: ex.id },
          data: { muscles: entry.muscles },
        });

        updatedCount++;
        console.log(`  Updated: "${ex.name}" → [${entry.muscles.join(", ")}]`);
      }
    }

    if (!matchedAny) notFoundNames.push(entry.names.join(" / "));
  }

  // Audit any remaining strength exercises with empty muscles
  const stillEmpty = await prisma.exercise.findMany({
    where: { category: "strength" },
  });
  const remaining = stillEmpty.filter((e) => {
    const m = Array.isArray(e.muscles) ? (e.muscles as unknown[]) : [];
    return m.length === 0;
  });

  console.log("\n── Summary ──────────────────────────────────");
  console.log(`  Exercises updated:                    ${updatedCount}`);
  console.log(`  Skipped (already had muscles):        ${skippedAlreadyHasMuscles}`);
  console.log(`  Strength exercises still empty:       ${remaining.length}`);

  if (remaining.length > 0) {
    console.log("\n  Strength exercises still missing muscles:");
    for (const e of remaining) console.log(`    - ${e.name}`);
  }

  if (notFoundNames.length > 0) {
    console.log(`\n  Mapping entries with no DB match (${notFoundNames.length}):`);
    for (const n of notFoundNames) console.log(`    - ${n}`);
  }

  console.log("──────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("Error backfilling muscles:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
