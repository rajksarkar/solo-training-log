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

export const VOLUME_LANDMARKS: Record<string, { mev: number; mav: number; mrv: number }> = {
  chest: { mev: 10, mav: 18, mrv: 22 },
  back: { mev: 10, mav: 18, mrv: 22 },
  shoulders: { mev: 8, mav: 16, mrv: 22 },
  quads: { mev: 8, mav: 16, mrv: 20 },
  hamstrings: { mev: 6, mav: 12, mrv: 16 },
  biceps: { mev: 6, mav: 14, mrv: 20 },
  triceps: { mev: 6, mav: 12, mrv: 18 },
  glutes: { mev: 4, mav: 12, mrv: 16 },
  calves: { mev: 8, mav: 16, mrv: 20 },
  core: { mev: 0, mav: 16, mrv: 20 },
};
