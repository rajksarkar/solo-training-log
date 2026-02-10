import { describe, it, expect } from "vitest";
import {
  createExerciseSchema,
  updateExerciseSchema,
} from "@/lib/validations/exercise";
import { CATEGORIES } from "@/lib/constants";

describe("createExerciseSchema", () => {
  it("accepts valid exercise with all fields", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      category: "strength",
      equipment: ["barbell", "bench"],
      muscles: ["chest", "triceps"],
      instructions: "Press the bar up",
      youtubeId: "abc123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal valid exercise (name + category)", () => {
    const result = createExerciseSchema.safeParse({
      name: "Running",
      category: "cardio",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.equipment).toEqual([]);
      expect(result.data.muscles).toEqual([]);
      expect(result.data.instructions).toBe("");
    }
  });

  it("accepts all valid categories from CATEGORIES constant", () => {
    for (const cat of CATEGORIES) {
      const result = createExerciseSchema.safeParse({
        name: `Test ${cat}`,
        category: cat,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid category", () => {
    const result = createExerciseSchema.safeParse({
      name: "Test",
      category: "invalid_category",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createExerciseSchema.safeParse({
      name: "",
      category: "strength",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 200 chars", () => {
    const result = createExerciseSchema.safeParse({
      name: "a".repeat(201),
      category: "strength",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing category", () => {
    const result = createExerciseSchema.safeParse({ name: "Squat" });
    expect(result.success).toBe(false);
  });

  it("allows nullable youtubeId", () => {
    const result = createExerciseSchema.safeParse({
      name: "Test",
      category: "strength",
      youtubeId: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateExerciseSchema", () => {
  it("accepts partial updates", () => {
    const result = updateExerciseSchema.safeParse({ name: "Updated Name" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all fields optional)", () => {
    const result = updateExerciseSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid category in partial update", () => {
    const result = updateExerciseSchema.safeParse({ category: "bad" });
    expect(result.success).toBe(false);
  });
});
