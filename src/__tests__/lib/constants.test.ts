import { describe, it, expect } from "vitest";
import { CATEGORIES } from "@/lib/constants";

describe("CATEGORIES constant", () => {
  it("has exactly 8 categories", () => {
    expect(CATEGORIES).toHaveLength(8);
  });

  it("contains all expected categories", () => {
    expect(CATEGORIES).toContain("strength");
    expect(CATEGORIES).toContain("cardio");
    expect(CATEGORIES).toContain("zone2");
    expect(CATEGORIES).toContain("pilates");
    expect(CATEGORIES).toContain("mobility");
    expect(CATEGORIES).toContain("plyometrics");
    expect(CATEGORIES).toContain("stretching");
    expect(CATEGORIES).toContain("other");
  });

  it("has no duplicate entries", () => {
    const unique = new Set(CATEGORIES);
    expect(unique.size).toBe(CATEGORIES.length);
  });
});
