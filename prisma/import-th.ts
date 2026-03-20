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

// Parse exercise data - handles many TH formats:
// "10, 10, 10 rep x 95, 95, 95 pound"
// "30, 30, 30 second x 0, 0, 0 pound"
// "1800 time x 2 mile"        (run: 1800 sec, 2 miles)
// "2.04 mile x 0 "            (run: 2.04 miles)
// " time x  mile"             (run: no data logged)
// "30:00 time x  "            (30 min bike)
// "4  x  "                    (threshold: speed = 4)
// "139  x  "                  (threshold: HR = 139)
// "250 meter x  "             (rowing: 250m)
// "676 meter x 31 "           (rowing: 676m, 31 strokes/watts)
// "134 watt x  "              (rowing: 134 watts)
function parseExerciseData(data: string): {
  sets: { reps: number | null; weight: number | null; unit: string; durationSec: number | null }[];
} {
  if (!data || data.trim() === "") {
    return { sets: [] };
  }

  const cleaned = data.replace(/"/g, "").trim();

  // Split on " x " or " x" (end of string) — TH data often ends with "value x" with no right side
  const xMatch = cleaned.match(/^(.+?)\s+x(?:\s+(.*))?$/);
  if (!xMatch) {
    return { sets: [] };
  }

  const leftPart = xMatch[1].trim();
  const rightPart = (xMatch[2] || "").trim();

  // Parse a side: extract numbers and unit
  // Handles: "10, 10, 10 rep", "1800 time", "2.04 mile", "30:00 time", "4 ", " time", "139 ", "250 meter"
  function parseSide(part: string): { values: number[]; unit: string } {
    if (!part.trim()) return { values: [], unit: "" };

    // Handle MM:SS format like "30:00 time"
    const timeColonMatch = part.match(/^(\d+):(\d+)\s*(time|minute|second)?s?\s*$/i);
    if (timeColonMatch) {
      const mins = parseInt(timeColonMatch[1]);
      const secs = parseInt(timeColonMatch[2]);
      return { values: [mins * 60 + secs], unit: "time" };
    }

    // General pattern: optional numbers, optional unit
    const match = part.match(/^([\d.,\s]*)\s*(rep|second|foot|minute|meter|yard|cal|time|mile|watt|pound|kg|kilogram)?s?\s*$/i);
    if (!match) return { values: [], unit: "" };

    const numStr = match[1]?.trim() || "";
    const unit = (match[2] || "").toLowerCase();

    if (!numStr) return { values: [], unit };

    const values = numStr
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !isNaN(n));

    return { values, unit };
  }

  const left = parseSide(leftPart);
  const right = parseSide(rightPart);

  // If no values on either side, nothing to import
  if (left.values.length === 0 && right.values.length === 0) {
    return { sets: [] };
  }

  const sets: { reps: number | null; weight: number | null; unit: string; durationSec: number | null }[] = [];

  // Determine what the data represents based on units
  const lu = left.unit;
  const ru = right.unit;

  // Time-based exercises (runs, bikes, cardio)
  if (lu === "time" || lu === "minute") {
    const durSec = left.values[0] ?? null;
    const duration = lu === "minute" && durSec ? durSec * 60 : durSec;
    // Right side could be distance (mile, meter) or empty
    const distance = right.values[0] ?? null;
    sets.push({
      reps: null,
      weight: null,
      unit: "lb",
      durationSec: duration,
    });
    // Store distance as a note via reps if available
    if (distance && distance > 0) {
      sets[0].reps = Math.round(distance * 100) / 100 as any; // miles * 100 for precision
    }
    return { sets };
  }

  // Distance on left (e.g. "2.04 mile x 0")
  if (lu === "mile") {
    const miles = left.values[0] ?? null;
    const timeSec = right.values[0] ?? null;
    sets.push({
      reps: null,
      weight: null,
      unit: "lb",
      durationSec: timeSec && timeSec > 0 ? timeSec : null,
    });
    if (miles && miles > 0) {
      sets[0].reps = Math.round(miles * 100) / 100 as any;
    }
    return { sets };
  }

  // Meter-based (rowing)
  if (lu === "meter") {
    const meters = left.values[0] ?? null;
    sets.push({
      reps: null,
      weight: null,
      unit: "lb",
      durationSec: meters, // store meters as duration for display
    });
    return { sets };
  }

  // Watt-based (rowing power)
  if (lu === "watt") {
    const watts = left.values[0] ?? null;
    sets.push({
      reps: watts ? Math.round(watts) : null,
      weight: null,
      unit: "lb",
      durationSec: null,
    });
    return { sets };
  }

  // Plain numbers without units (threshold speed, HR, etc.)
  if (!lu && left.values.length > 0) {
    const val = left.values[0];
    sets.push({
      reps: val ? Math.round(val * 10) / 10 as any : null,
      weight: null,
      unit: "lb",
      durationSec: null,
    });
    return { sets };
  }

  // Standard rep/weight exercises
  const numSets = left.values.length;
  for (let i = 0; i < numSets; i++) {
    const leftVal = left.values[i];
    const rightVal = right.values[i] ?? right.values[right.values.length - 1] ?? null;
    const weight = rightVal && !isNaN(rightVal) && rightVal > 0 ? rightVal : null;
    const weightUnit = ru === "kg" || ru === "kilogram" ? "kg" : "lb";

    if (lu === "second") {
      sets.push({ reps: null, weight, unit: weightUnit, durationSec: isNaN(leftVal) ? null : leftVal });
    } else if (lu === "rep") {
      sets.push({ reps: isNaN(leftVal) ? null : leftVal, weight, unit: weightUnit, durationSec: null });
    } else if (lu === "foot" || lu === "yard") {
      sets.push({ reps: null, weight, unit: weightUnit, durationSec: isNaN(leftVal) ? null : leftVal });
    } else if (lu === "cal") {
      sets.push({ reps: isNaN(leftVal) ? null : leftVal, weight: null, unit: "lb", durationSec: null });
    } else {
      sets.push({ reps: isNaN(leftVal) ? null : leftVal, weight, unit: weightUnit, durationSec: null });
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
