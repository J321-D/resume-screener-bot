import { z } from "zod";

export const analysisModes = ["Skills-focused analysis", "Full lexical analysis"] as const;
export type AnalysisMode = (typeof analysisModes)[number];

const termSchema = z.object({
  term: z.string(),
  count: z.number().int().positive(),
  category: z.string().nullable(),
});

const categorySchema = z.object({
  category: z.string(),
  matched: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  score: z.number().nullable(),
  display_value: z.string(),
  included_in_primary: z.boolean(),
});

export const analysisResponseSchema = z.object({
  analysis_mode: z.enum(analysisModes),
  coverage: z.object({
    score: z.number().nullable(),
    matched: z.number().int().nonnegative(),
    missing: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    label: z.string(),
  }),
  matched_terms: z.array(termSchema),
  missing_terms: z.array(termSchema),
  categories: z.array(categorySchema),
  normalized_matches: z.array(z.object({
    concept: z.string(),
    resume_term: z.string(),
    job_term: z.string(),
  })),
  metadata: z.object({
    resume_label: z.string(),
    resume_count: z.number().int().positive(),
    input_mode: z.string(),
    analyzed_at: z.string().datetime({ offset: true }),
  }),
  warnings: z.array(z.object({
    code: z.string(),
    message: z.string(),
    field: z.string().nullable(),
    request_id: z.string().nullable(),
  })),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

export interface AnalysisInputs {
  analysisMode: AnalysisMode;
  resumeFiles: File[];
  resumeText: string;
  jobFile: File | null;
  jobText: string;
}

export interface PublicError {
  code: string;
  message: string;
  field?: string | null;
  request_id?: string | null;
}
