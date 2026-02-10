import { describe, it, expect } from "vitest";
import {
  createSessionSchema,
  updateSessionSchema,
  addSessionExerciseSchema,
  setLogSchema,
  bulkUpsertLogsSchema,
} from "@/lib/validations/session";
import { CATEGORIES } from "@/lib/constants";

describe("createSessionSchema", () => {
  const validData = {
    title: "Morning Workout",
    category: "strength",
    date: "2024-01-15",
  };

  it("accepts valid session data", () => {
    const result = createSessionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts session with notes and templateId", () => {
    const result = createSessionSchema.safeParse({
      ...validData,
      notes: "Felt great",
      templateId: "tmpl_123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createSessionSchema.safeParse({ ...validData, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 200 chars", () => {
    const result = createSessionSchema.safeParse({
      ...validData,
      title: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = createSessionSchema.safeParse({
      ...validData,
      date: "01-15-2024",
    });
    expect(result.success).toBe(false);
  });

  it("rejects date with wrong separator", () => {
    const result = createSessionSchema.safeParse({
      ...validData,
      date: "2024/01/15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = createSessionSchema.safeParse({
      ...validData,
      category: "invalid",
    });
    expect(result.success).toBe(false);
  });

  // BUG TEST: session schema should accept all categories from constants
  it("should accept all CATEGORIES from constants", () => {
    const failures: string[] = [];
    for (const cat of CATEGORIES) {
      const result = createSessionSchema.safeParse({
        ...validData,
        category: cat,
      });
      if (!result.success) {
        failures.push(cat);
      }
    }
    expect(failures).toEqual([]);
  });
});

describe("updateSessionSchema", () => {
  it("accepts partial updates", () => {
    const result = updateSessionSchema.safeParse({ title: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateSessionSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("addSessionExerciseSchema", () => {
  it("accepts valid data", () => {
    const result = addSessionExerciseSchema.safeParse({
      exerciseId: "ex_123",
      order: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts with optional notes", () => {
    const result = addSessionExerciseSchema.safeParse({
      exerciseId: "ex_123",
      order: 1,
      notes: "Warm up first",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative order", () => {
    const result = addSessionExerciseSchema.safeParse({
      exerciseId: "ex_123",
      order: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer order", () => {
    const result = addSessionExerciseSchema.safeParse({
      exerciseId: "ex_123",
      order: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("setLogSchema", () => {
  const validLog = {
    sessionExerciseId: "se_123",
    setIndex: 0,
  };

  it("accepts minimal set log", () => {
    const result = setLogSchema.safeParse(validLog);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unit).toBe("lb");
      expect(result.data.completed).toBe(true);
    }
  });

  it("accepts full set log", () => {
    const result = setLogSchema.safeParse({
      ...validLog,
      reps: 10,
      weight: 135.5,
      unit: "kg",
      durationSec: 60,
      distanceMeters: 1000,
      rpe: 8,
      completed: false,
      notes: "Hard set",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative reps", () => {
    const result = setLogSchema.safeParse({ ...validLog, reps: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer reps", () => {
    const result = setLogSchema.safeParse({ ...validLog, reps: 5.5 });
    expect(result.success).toBe(false);
  });

  it("rejects RPE below 1", () => {
    const result = setLogSchema.safeParse({ ...validLog, rpe: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects RPE above 10", () => {
    const result = setLogSchema.safeParse({ ...validLog, rpe: 11 });
    expect(result.success).toBe(false);
  });

  it("accepts RPE at boundaries (1 and 10)", () => {
    expect(setLogSchema.safeParse({ ...validLog, rpe: 1 }).success).toBe(true);
    expect(setLogSchema.safeParse({ ...validLog, rpe: 10 }).success).toBe(true);
  });

  it("rejects invalid unit", () => {
    const result = setLogSchema.safeParse({ ...validLog, unit: "stone" });
    expect(result.success).toBe(false);
  });

  it("accepts null values for nullable fields", () => {
    const result = setLogSchema.safeParse({
      ...validLog,
      reps: null,
      weight: null,
      durationSec: null,
      distanceMeters: null,
      rpe: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative setIndex", () => {
    const result = setLogSchema.safeParse({
      sessionExerciseId: "se_123",
      setIndex: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("bulkUpsertLogsSchema", () => {
  it("accepts array of valid logs", () => {
    const result = bulkUpsertLogsSchema.safeParse({
      logs: [
        { sessionExerciseId: "se_1", setIndex: 0, reps: 10, weight: 135 },
        { sessionExerciseId: "se_1", setIndex: 1, reps: 8, weight: 155 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty logs array", () => {
    const result = bulkUpsertLogsSchema.safeParse({ logs: [] });
    expect(result.success).toBe(true);
  });

  it("rejects if any log is invalid", () => {
    const result = bulkUpsertLogsSchema.safeParse({
      logs: [
        { sessionExerciseId: "se_1", setIndex: 0, reps: 10 },
        { sessionExerciseId: "se_1", setIndex: -1 }, // invalid setIndex
      ],
    });
    expect(result.success).toBe(false);
  });
});
