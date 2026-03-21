import { z } from "zod";

export const bodyCompositionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scanType: z.string().max(50).optional().default("dexa"),
  weight: z.number().positive(),
  bodyFatPct: z.number().min(1).max(60),
  fatMass: z.number().positive().optional(),
  leanMass: z.number().positive().optional(),
  visceralFat: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});
