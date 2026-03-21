import { z } from "zod";

export const bodyWeightSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight: z.number().positive().max(1000),
  unit: z.enum(["lb", "kg"]).optional().default("lb"),
  notes: z.string().max(500).optional(),
});
