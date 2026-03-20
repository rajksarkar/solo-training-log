/**
 * Import Train Heroic data export into Solo Training database.
 *
 * Usage: npx tsx prisma/import-th.ts
 *
 * Reads from: th-data/training_data.csv
 * Creates: exercises, sessions, session exercises, and set logs
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

const USER_EMAIL = "raj.sarkar@gmail.com";
const USER_NAME = "Raj Sarkar";

// Parse CSV line respecting quoted fields
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// Parse exercise data like "10, 10, 10 rep x 95, 95, 95 pound"
// or "30, 30, 30 second x 0, 0, 0 pound"
// or "10 rep x  "
function parseExerciseData(data: string): {
  sets: { reps: number | null; weight: number | null; unit: string; durationSec: number | null }[];
} {
  if (!data || data.trim() === "") {
    return { sets: [] };
  }

  const cleaned = data.replace(/"/g, "").trim();

  // Match pattern: "values unit x values unit"
  const xSplit = cleaned.split(" x ");
  if (xSplit.length < 2) {
    return { sets: [] };
  }

  const leftPart = xSplit[0].trim();
  const rightPart = xSplit.slice(1).join(" x ").trim();

  // Parse left side - extract numbers and unit
  // Pattern: "10, 10, 10 rep" or "30, 30, 30 second" or "20, 20, 20 foot"
  const leftMatch = leftPart.match(/^([\d.,\s]+)\s*(rep|second|foot|minute|meter|yard|cal)s?$/i);
  if (!leftMatch) {
    return { sets: [] };
  }

  const leftValues = leftMatch[1]
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map(Number);
  const leftUnit = leftMatch[2].toLowerCase();

  // Parse right side - extract numbers and unit
  // Pattern: "95, 95, 95 pound" or " " (empty)
  let rightValues: number[] = [];
  let rightUnit = "pound";

  if (rightPart.trim()) {
    const rightMatch = rightPart.match(/^([\d.,\s]*)\s*(pound|kg|kilogram)?s?\s*$/i);
    if (rightMatch && rightMatch[1]?.trim()) {
      rightValues = rightMatch[1]
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .map(Number);
      rightUnit = rightMatch[2]?.toLowerCase() || "pound";
    }
  }

  const numSets = leftValues.length;
  const sets: { reps: number | null; weight: number | null; unit: string; durationSec: number | null }[] = [];

  for (let i = 0; i < numSets; i++) {
    const leftVal = leftValues[i];
    const rightVal = rightValues[i] ?? rightValues[rightValues.length - 1] ?? null;
    const weight = rightVal && !isNaN(rightVal) && rightVal > 0 ? rightVal : null;
    const unit = rightUnit === "kg" || rightUnit === "kilogram" ? "kg" : "lb";

    if (leftUnit === "second") {
      sets.push({
        reps: null,
        weight,
        unit,
        durationSec: isNaN(leftVal) ? null : leftVal,
      });
    } else if (leftUnit === "rep") {
      sets.push({
        reps: isNaN(leftVal) ? null : leftVal,
        weight,
        unit,
        durationSec: null,
      });
    } else if (leftUnit === "foot" || leftUnit === "meter" || leftUnit === "yard") {
      // Distance-based: store as duration placeholder
      sets.push({
        reps: null,
        weight,
        unit,
        durationSec: isNaN(leftVal) ? null : leftVal,
      });
    } else if (leftUnit === "minute") {
      sets.push({
        reps: null,
        weight: null,
        unit: "lb",
        durationSec: isNaN(leftVal) ? null : leftVal * 60,
      });
    } else if (leftUnit === "cal") {
      sets.push({
        reps: isNaN(leftVal) ? null : leftVal,
        weight: null,
        unit: "lb",
        durationSec: null,
      });
    } else {
      sets.push({
        reps: isNaN(leftVal) ? null : leftVal,
        weight,
        unit,
        durationSec: null,
      });
    }
  }

  return { sets };
}

// Categorize an exercise based on its name
function categorizeExercise(name: string): string {
  const n = name.toLowerCase();

  // Cardio / Zone 2
  if (
    n.includes("run") ||
    n.includes("rowing") ||
    n.includes("bike") ||
    n.includes("cardio") ||
    n.includes("walk") ||
    n.includes("zone 2") ||
    n.includes("zone2") ||
    n.includes("threshold") ||
    n.includes("rower audit") ||
    n.includes("stationary")
  ) {
    if (n.includes("zone 2") || n.includes("zone2") || n.includes("steady state")) {
      return "zone2";
    }
    return "cardio";
  }

  // Stretching / Mobility
  if (
    n.includes("stretch") ||
    n.includes("prayer") ||
    n.includes("nerve gliding") ||
    n.includes("foam roller") ||
    n.includes("wall slide") ||
    n.includes("serratus")
  ) {
    return "stretching";
  }

  if (
    n.includes("bear crawl") ||
    n.includes("beast position") ||
    n.includes("bird dog") ||
    n.includes("kb arm bar") ||
    n.includes("halo")
  ) {
    return "mobility";
  }

  // Plyometrics
  if (n.includes("plyo") || n.includes("step-up")) {
    return "plyometrics";
  }

  // Everything else is strength
  return "strength";
}

async function main() {
  console.log("Starting Train Heroic data import...\n");

  // Ensure user exists
  let user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: USER_EMAIL, name: USER_NAME },
    });
    console.log(`Created user: ${user.name} (${user.id})`);
  } else {
    console.log(`Found user: ${user.name} (${user.id})`);
  }

  // Read CSV
  const csvPath = resolve(__dirname, "../th-data/training_data.csv");
  const csv = readFileSync(csvPath, "utf-8");
  const lines = csv.split("\n").filter(Boolean);
  const header = parseCSVLine(lines[0]);
  console.log(`CSV columns: ${header.join(", ")}`);
  console.log(`Total rows: ${lines.length - 1}\n`);

  // Parse all rows
  type Row = {
    workoutTitle: string;
    scheduledDate: string;
    rescheduledDate: string;
    workoutNotes: string;
    exerciseTitle: string;
    exerciseData: string;
    exerciseNotes: string;
  };

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 11) continue;

    rows.push({
      workoutTitle: fields[0],
      scheduledDate: fields[1],
      rescheduledDate: fields[2],
      workoutNotes: fields[3],
      exerciseTitle: fields[8],
      exerciseData: fields[9],
      exerciseNotes: fields[10],
    });
  }

  // Get unique exercise names from TH data
  const uniqueExerciseNames = [...new Set(rows.map((r) => r.exerciseTitle))].filter(Boolean);
  console.log(`Unique exercises in TH data: ${uniqueExerciseNames.length}`);

  // Get existing exercises from DB
  const existingExercises = await prisma.exercise.findMany();
  const exerciseMap = new Map<string, string>(); // name (lowercase) -> id

  for (const ex of existingExercises) {
    exerciseMap.set(ex.name.toLowerCase(), ex.id);
  }

  // Create missing exercises
  let created = 0;
  for (const name of uniqueExerciseNames) {
    if (!exerciseMap.has(name.toLowerCase())) {
      const category = categorizeExercise(name);
      const ex = await prisma.exercise.create({
        data: {
          name,
          category: category as any,
          equipment: [],
          muscles: [],
          instructions: "",
        },
      });
      exerciseMap.set(name.toLowerCase(), ex.id);
      created++;
    }
  }
  console.log(`Created ${created} new exercises`);

  // Group rows into workouts (by title + date combination)
  type Workout = {
    title: string;
    date: string;
    notes: string;
    exercises: { name: string; data: string; notes: string }[];
  };

  const workoutMap = new Map<string, Workout>();

  for (const row of rows) {
    const date = row.rescheduledDate || row.scheduledDate;
    if (!date) continue;

    const key = `${row.workoutTitle.trim()}|${date}`;
    if (!workoutMap.has(key)) {
      workoutMap.set(key, {
        title: row.workoutTitle.trim(),
        date,
        notes: row.workoutNotes,
        exercises: [],
      });
    }
    workoutMap.get(key)!.exercises.push({
      name: row.exerciseTitle,
      data: row.exerciseData,
      notes: row.exerciseNotes,
    });
  }

  console.log(`\nTotal workouts to import: ${workoutMap.size}`);

  // Check for existing sessions to avoid duplicates
  const existingSessions = await prisma.session.findMany({
    where: { ownerId: user.id },
    select: { title: true, date: true },
  });
  const existingSessionKeys = new Set(
    existingSessions.map((s) => `${s.title}|${s.date.toISOString().slice(0, 10)}`)
  );

  let imported = 0;
  let skipped = 0;

  for (const [, workout] of workoutMap) {
    const sessionKey = `${workout.title}|${workout.date}`;
    if (existingSessionKeys.has(sessionKey)) {
      skipped++;
      continue;
    }

    // Determine session category from exercises
    const categories = workout.exercises.map((e) =>
      categorizeExercise(e.name)
    );
    const primaryCategory =
      categories.find((c) => c === "strength") ??
      categories.find((c) => c !== "other") ??
      "strength";

    try {
      const session = await prisma.session.create({
        data: {
          ownerId: user.id,
          title: workout.title,
          category: primaryCategory as any,
          date: new Date(workout.date),
          notes: workout.notes || null,
        },
      });

      // Add exercises to session
      for (let i = 0; i < workout.exercises.length; i++) {
        const ex = workout.exercises[i];
        const exerciseId = exerciseMap.get(ex.name.toLowerCase());
        if (!exerciseId) {
          console.warn(`  Exercise not found: "${ex.name}"`);
          continue;
        }

        const sessionExercise = await prisma.sessionExercise.create({
          data: {
            sessionId: session.id,
            exerciseId,
            order: i,
            notes: ex.notes || null,
          },
        });

        // Parse and create set logs
        const { sets } = parseExerciseData(ex.data);
        for (let j = 0; j < sets.length; j++) {
          const set = sets[j];
          await prisma.setLog.create({
            data: {
              sessionExerciseId: sessionExercise.id,
              setIndex: j,
              reps: set.reps,
              weight: set.weight,
              unit: set.unit === "kg" ? "kg" : "lb",
              durationSec: set.durationSec,
              completed: true,
            },
          });
        }
      }

      imported++;
      if (imported % 20 === 0) {
        console.log(`  Imported ${imported} workouts...`);
      }
    } catch (err) {
      console.error(`  Error importing workout "${workout.title}" on ${workout.date}:`, err);
    }
  }

  console.log(`\nImport complete!`);
  console.log(`  Imported: ${imported} workouts`);
  console.log(`  Skipped (already exist): ${skipped}`);
  console.log(`  Total exercises in library: ${exerciseMap.size}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
