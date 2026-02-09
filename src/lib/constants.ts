export const CATEGORIES = [
  "strength",
  "cardio",
  "zone2",
  "pilates",
  "mobility",
  "plyometrics",
  "stretching",
  "other",
] as const;

export type ExerciseCategory = (typeof CATEGORIES)[number];
