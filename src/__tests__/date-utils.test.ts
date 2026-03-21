import { describe, it, expect } from "vitest";

// Replicate the formatDate function used in the weekly view
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Replicate the formatSessionDate function used in session detail
function formatSessionDate(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Replicate getMonday
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

describe("formatDate - no UTC timezone shift", () => {
  it("should return local date as YYYY-MM-DD", () => {
    const d = new Date(2026, 2, 18); // March 18, 2026 local
    expect(formatDate(d)).toBe("2026-03-18");
  });

  it("should not shift date due to timezone", () => {
    // Simulate late evening EDT: 11pm March 18 local
    const d = new Date(2026, 2, 18, 23, 0, 0);
    expect(formatDate(d)).toBe("2026-03-18");
  });

  it("should handle midnight correctly", () => {
    const d = new Date(2026, 2, 18, 0, 0, 0);
    expect(formatDate(d)).toBe("2026-03-18");
  });

  it("should handle January (month padding)", () => {
    const d = new Date(2026, 0, 5);
    expect(formatDate(d)).toBe("2026-01-05");
  });
});

describe("formatSessionDate - UTC date string to local display", () => {
  it("should display correct day of week for UTC midnight date", () => {
    // 2026-03-18 is a Wednesday
    const result = formatSessionDate("2026-03-18T00:00:00.000Z");
    expect(result).toContain("Wed");
    expect(result).toContain("Mar");
    expect(result).toContain("18");
  });

  it("should not show previous day (timezone bug)", () => {
    // This was the bug: UTC midnight showed as previous day in EDT
    const result = formatSessionDate("2026-03-20T00:00:00.000Z");
    expect(result).toContain("Fri");
    expect(result).toContain("20");
  });
});

describe("getMonday", () => {
  it("should return Monday for a Wednesday", () => {
    const wed = new Date(2026, 2, 18); // Wed March 18
    const mon = getMonday(wed);
    expect(mon.getDay()).toBe(1); // Monday
    expect(mon.getDate()).toBe(16); // March 16
  });

  it("should return same day for a Monday", () => {
    const mon = new Date(2026, 2, 16); // Mon March 16
    const result = getMonday(mon);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(16);
  });

  it("should handle Sunday correctly (go back to previous Monday)", () => {
    const sun = new Date(2026, 2, 22); // Sun March 22
    const mon = getMonday(sun);
    expect(mon.getDay()).toBe(1);
    expect(mon.getDate()).toBe(16);
  });
});

describe("session date matching", () => {
  it("should match API UTC date to local selected date", () => {
    // API returns "2026-03-18T00:00:00.000Z"
    const apiDate = "2026-03-18T00:00:00.000Z";
    const apiDateStr = apiDate.slice(0, 10); // "2026-03-18"

    // Selected date from local calendar
    const localDate = new Date(2026, 2, 18);
    const selectedDateStr = formatDate(localDate); // "2026-03-18"

    expect(apiDateStr).toBe(selectedDateStr);
  });
});
