import { describe, it, expect } from "vitest";

// Replicate summarizeExercise logic for testing
type SetLog = {
  reps: number | null;
  weight: number | null;
  unit: string;
  durationSec: number | null;
  distanceMeters: number | null;
  rpe: number | null;
  completed: boolean;
  notes: string | null;
};

type SessionExercise = {
  id: string;
  exercise: { name: string; category: string };
  setLogs: SetLog[];
};

// Replicate getExerciseInputType for testing
function getExerciseInputType(
  exerciseName: string,
  _category: string,
  logs: { weight: number | null; durationSec: number | null }[]
): "strength" | "cardio" | "metric" | "bodyweight" {
  const name = exerciseName.toLowerCase();
  if (name.includes("heart rate") || name.includes("average speed") || name.includes("watt") || name.includes("rower audit")) return "metric";
  if (name === "run" || name === "walk" || name.includes("stationary bike") || name.includes("rowing") || name.includes("cardio")) return "cardio";
  if (logs.some((l) => l.weight != null && l.weight > 0)) return "strength";
  if (logs.some((l) => l.durationSec != null && l.durationSec > 0)) return "cardio";
  if (name.includes("plank") || name.includes("push-up") || name.includes("pushup") || name.includes("bear crawl") || name.includes("bird dog") || name.includes("stretch") || name.includes("yoga")) return "bodyweight";
  return "strength";
}

describe("getExerciseInputType", () => {
  it("should identify HR as metric", () => {
    expect(getExerciseInputType("Threshold Work (zone 3/4) Average Heart Rate", "cardio", [])).toBe("metric");
  });

  it("should identify speed as metric", () => {
    expect(getExerciseInputType("Threshold Work (zone 3/4) Average Speed", "cardio", [])).toBe("metric");
  });

  it("should identify run as cardio", () => {
    expect(getExerciseInputType("Run", "cardio", [])).toBe("cardio");
  });

  it("should identify stationary bike as cardio", () => {
    expect(getExerciseInputType("Stationary Bike", "cardio", [])).toBe("cardio");
  });

  it("should identify bench press with weight data as strength", () => {
    expect(getExerciseInputType("Bench Press", "strength", [{ weight: 135, durationSec: null }])).toBe("strength");
  });

  it("should identify side plank as bodyweight", () => {
    expect(getExerciseInputType("Copenhagen Side Plank", "strength", [{ weight: null, durationSec: null }])).toBe("bodyweight");
  });

  it("should identify adductor side plank as bodyweight", () => {
    expect(getExerciseInputType("Adductor Side Plank", "strength", [{ weight: null, durationSec: null }])).toBe("bodyweight");
  });

  it("should identify hand release pushup as bodyweight", () => {
    expect(getExerciseInputType("Hand Release Pushup", "strength", [{ weight: null, durationSec: null }])).toBe("bodyweight");
  });

  it("should identify bear crawls as bodyweight", () => {
    expect(getExerciseInputType("Bear Crawls", "mobility", [{ weight: null, durationSec: null }])).toBe("bodyweight");
  });
});

describe("exercise data display format", () => {
  // Replicate summarizeExercise
  function summarize(ex: SessionExercise): string {
    const logs = ex.setLogs?.filter((l) => l.completed) ?? [];
    if (logs.length === 0) return "no data";

    const name = ex.exercise.name.toLowerCase();

    if (name.includes("heart rate")) {
      return logs[0]?.reps != null ? `${logs[0].reps} bpm` : "—";
    }
    if (name.includes("average speed")) {
      return logs[0]?.reps != null ? `${logs[0].reps} mph` : "—";
    }

    const hasWeight = logs.some((l) => l.weight != null && l.weight > 0);
    const hasReps = logs.some((l) => l.reps != null && l.reps > 0);

    if (hasReps && hasWeight) {
      const sets = logs.length;
      const repsValues = [...new Set(logs.map((l) => l.reps).filter(Boolean))];
      const weightValues = [...new Set(logs.map((l) => l.weight).filter(Boolean))];
      const unit = logs[0]?.unit ?? "lb";
      let summary = repsValues.length === 1 ? `${sets}x${repsValues[0]}` : `${sets} sets`;
      if (weightValues.length === 1) summary += ` @ ${weightValues[0]} ${unit}`;
      return summary;
    }

    if (hasReps) {
      const repsValues = [...new Set(logs.map((l) => l.reps).filter(Boolean))];
      return repsValues.length === 1 ? `${logs.length}x${repsValues[0]}` : `${logs.length} sets`;
    }

    return `${logs.length} sets`;
  }

  function makeLog(reps: number | null, weight: number | null, unit = "lb"): SetLog {
    return { reps, weight, unit, durationSec: null, distanceMeters: null, rpe: null, completed: true, notes: null };
  }

  it("should show HR value for heart rate exercise", () => {
    const ex: SessionExercise = {
      id: "1",
      exercise: { name: "Threshold Work (zone 3/4) Average Heart Rate", category: "cardio" },
      setLogs: [makeLog(136, null)],
    };
    expect(summarize(ex)).toBe("136 bpm");
  });

  it("should show speed for speed exercise", () => {
    const ex: SessionExercise = {
      id: "2",
      exercise: { name: "Threshold Work (zone 3/4) Average Speed", category: "cardio" },
      setLogs: [makeLog(4, null)],
    };
    expect(summarize(ex)).toBe("4 mph");
  });

  it("should show sets x reps @ weight for uniform strength exercise", () => {
    const ex: SessionExercise = {
      id: "3",
      exercise: { name: "DB Bench Press", category: "strength" },
      setLogs: [makeLog(12, 45), makeLog(12, 45), makeLog(12, 45), makeLog(12, 45)],
    };
    expect(summarize(ex)).toBe("4x12 @ 45 lb");
  });

  it("should show reps only for bodyweight exercise", () => {
    const ex: SessionExercise = {
      id: "4",
      exercise: { name: "Hand Release Pushup", category: "strength" },
      setLogs: [makeLog(5, null), makeLog(5, null), makeLog(5, null), makeLog(5, null)],
    };
    expect(summarize(ex)).toBe("4x5");
  });
});

describe("import parser - TH exercise data formats", () => {
  // Replicate parseSide from import script
  function parseSide(part: string): { values: number[]; unit: string } {
    if (!part.trim()) return { values: [], unit: "" };
    const timeColonMatch = part.match(/^(\d+):(\d+)\s*(time|minute|second)?s?\s*$/i);
    if (timeColonMatch) {
      return { values: [parseInt(timeColonMatch[1]) * 60 + parseInt(timeColonMatch[2])], unit: "time" };
    }
    const match = part.match(/^([\d.,\s]*)\s*(rep|second|foot|minute|meter|yard|cal|time|mile|watt|pound|kg|kilogram)?s?\s*$/i);
    if (!match) return { values: [], unit: "" };
    const numStr = match[1]?.trim() || "";
    const unit = (match[2] || "").toLowerCase();
    if (!numStr) return { values: [], unit };
    const values = numStr.split(",").map((v) => v.trim()).filter(Boolean).map(Number).filter((n) => !isNaN(n));
    return { values, unit };
  }

  it("should parse standard reps x weight", () => {
    const left = parseSide("10, 10, 10 rep");
    expect(left).toEqual({ values: [10, 10, 10], unit: "rep" });
  });

  it("should parse time-based (run)", () => {
    const left = parseSide("1800 time");
    expect(left).toEqual({ values: [1800], unit: "time" });
  });

  it("should parse mile distance", () => {
    const left = parseSide("2.04 mile");
    expect(left).toEqual({ values: [2.04], unit: "mile" });
  });

  it("should parse MM:SS format", () => {
    const left = parseSide("30:00 time");
    expect(left).toEqual({ values: [1800], unit: "time" });
  });

  it("should parse plain number (threshold)", () => {
    const left = parseSide("4 ");
    expect(left).toEqual({ values: [4], unit: "" });
  });

  it("should parse HR value", () => {
    const left = parseSide("136 ");
    expect(left).toEqual({ values: [136], unit: "" });
  });

  it("should parse meter distance (rowing)", () => {
    const left = parseSide("250 meter");
    expect(left).toEqual({ values: [250], unit: "meter" });
  });

  it("should parse watt (rowing power)", () => {
    const left = parseSide("134 watt");
    expect(left).toEqual({ values: [134], unit: "watt" });
  });

  it("should handle empty time (no data logged)", () => {
    const left = parseSide(" time");
    expect(left).toEqual({ values: [], unit: "time" });
  });
});
