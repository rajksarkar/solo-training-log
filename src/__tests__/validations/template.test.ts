import { describe, it, expect } from "vitest";
import {
  createTemplateSchema,
  updateTemplateSchema,
  addTemplateExerciseSchema,
  updateTemplateExerciseSchema,
} from "@/lib/validations/template";
import { CATEGORIES } from "@/lib/constants";

describe("createTemplateSchema", () => {
  it("accepts valid template data", () => {
    const result = createTemplateSchema.safeParse({
      title: "Push Day",
      category: "strength",
    });
    expect(result.success).toBe(true);
  });

  it("accepts template with notes", () => {
    const result = createTemplateSchema.safeParse({
      title: "Cardio Blast",
      category: "cardio",
      notes: "HIIT style",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createTemplateSchema.safeParse({
      title: "",
      category: "strength",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 200 chars", () => {
    const result = createTemplateSchema.safeParse({
      title: "x".repeat(201),
      category: "strength",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = createTemplateSchema.safeParse({
      title: "Test",
      category: "yoga",
    });
    expect(result.success).toBe(false);
  });

  // BUG TEST: template schema should accept all categories from constants
  it("should accept all CATEGORIES from constants", () => {
    const failures: string[] = [];
    for (const cat of CATEGORIES) {
      const result = createTemplateSchema.safeParse({
        title: `Test ${cat}`,
        category: cat,
      });
      if (!result.success) {
        failures.push(cat);
      }
    }
    expect(failures).toEqual([]);
  });
});

describe("updateTemplateSchema", () => {
  it("accepts partial updates", () => {
    const result = updateTemplateSchema.safeParse({ title: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateTemplateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("addTemplateExerciseSchema", () => {
  it("accepts valid data with defaults", () => {
    const result = addTemplateExerciseSchema.safeParse({
      exerciseId: "ex_123",
      order: 0,
      defaultSets: 3,
      defaultReps: 10,
      defaultWeight: 135,
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal data", () => {
    const result = addTemplateExerciseSchema.safeParse({
      exerciseId: "ex_123",
      order: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts with defaultDurationSec", () => {
    const result = addTemplateExerciseSchema.safeParse({
      exerciseId: "ex_123",
      order: 0,
      defaultDurationSec: 300,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative order", () => {
    const result = addTemplateExerciseSchema.safeParse({
      exerciseId: "ex_123",
      order: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative defaultSets", () => {
    const result = addTemplateExerciseSchema.safeParse({
      exerciseId: "ex_123",
      order: 0,
      defaultSets: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateTemplateExerciseSchema", () => {
  it("accepts partial update", () => {
    const result = updateTemplateExerciseSchema.safeParse({
      defaultReps: 12,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null values for nullable fields", () => {
    const result = updateTemplateExerciseSchema.safeParse({
      defaultSets: null,
      defaultReps: null,
      defaultWeight: null,
      defaultDurationSec: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateTemplateExerciseSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
