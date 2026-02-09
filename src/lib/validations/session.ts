import { z } from "zod";

const exerciseCategoryEnum = z.enum([
  "strength",
  "cardio",
  "zone2",
  "pilates",
  "mobility",
  "other",
]);

const weightUnitEnum = z.enum(["lb", "kg"]);

export const createSessionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  category: exerciseCategoryEnum,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  notes: z.string().optional(),
  templateId: z.string().optional(),
});

export const updateSessionSchema = createSessionSchema.partial();

export const addSessionExerciseSchema = z.object({
  exerciseId: z.string(),
  order: z.number().int().min(0),
  notes: z.string().optional(),
});

export const setLogSchema = z.object({
  sessionExerciseId: z.string(),
  setIndex: z.number().int().min(0),
  reps: z.number().int().min(0).optional().nullable(),
  weight: z.number().optional().nullable(),
  unit: weightUnitEnum.optional().default("lb"),
  durationSec: z.number().int().min(0).optional().nullable(),
  distanceMeters: z.number().int().min(0).optional().nullable(),
  rpe: z.number().int().min(1).max(10).optional().nullable(),
  completed: z.boolean().optional().default(true),
  notes: z.string().optional().nullable(),
});

export const bulkUpsertLogsSchema = z.object({
  logs: z.array(setLogSchema),
});
