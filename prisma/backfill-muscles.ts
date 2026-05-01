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
 * undercounts. This script populates muscles (primary first) for strength
 * exercises imported from Train Heroic with empty muscles arrays.
 *
 * The mapping itself lives in `prisma/muscle-map.ts` so the import script
 * can apply the same tags at create time. Keep the two in sync via that
 * shared module.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { MUSCLE_ASSIGNMENTS } from "./muscle-map";

const prisma = new PrismaClient();

async function main() {
  console.log("Backfilling muscles for exercises with empty muscles arrays...\n");

  let updatedCount = 0;
  let skippedAlreadyHasMuscles = 0;
  const notFoundNames: string[] = [];

  for (const entry of MUSCLE_ASSIGNMENTS) {
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
