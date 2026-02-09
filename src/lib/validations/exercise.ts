import { z } from "zod";
import { CATEGORIES } from "@/lib/constants";

const exerciseCategoryEnum = z.enum(CATEGORIES);

export const createExerciseSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  category: exerciseCategoryEnum,
  equipment: z.array(z.string()).optional().default([]),
  muscles: z.array(z.string()).optional().default([]),
  instructions: z.string().optional().default(""),
  youtubeId: z.string().optional().nullable(),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
