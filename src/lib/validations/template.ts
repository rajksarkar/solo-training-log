import { z } from "zod";

const exerciseCategoryEnum = z.enum([
  "strength",
  "cardio",
  "zone2",
  "pilates",
  "mobility",
  "other",
]);

export const createTemplateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  category: exerciseCategoryEnum,
  notes: z.string().optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const addTemplateExerciseSchema = z.object({
  exerciseId: z.string(),
  order: z.number().int().min(0),
  defaultSets: z.number().int().min(0).optional(),
  defaultReps: z.number().int().min(0).optional(),
  defaultWeight: z.number().optional(),
  defaultDurationSec: z.number().int().min(0).optional(),
});

export const updateTemplateExerciseSchema = z.object({
  order: z.number().int().min(0).optional(),
  defaultSets: z.number().int().min(0).optional().nullable(),
  defaultReps: z.number().int().min(0).optional().nullable(),
  defaultWeight: z.number().optional().nullable(),
  defaultDurationSec: z.number().int().min(0).optional().nullable(),
});
