import { z } from 'zod';

/**
 * Zod schema mirroring the ResearchAnswer interface in engine.ts.
 * Shared by the API (structured LLM output) and the mobile client
 * (validation of streamed payloads). Keep the two in sync.
 */
export const citationSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  title: z.string(),
  quote: z.string(),
});

export const claimSchema = z.object({
  text: z.string(),
  citationIds: z.array(z.string()),
});

export const researchAnswerSchema = z.object({
  title: z.string(),
  directAnswer: z.string(),
  keyPoints: z.array(z.string()),
  stats: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
  timeline: z.array(z.string()),
  fantasyImpact: z.string().optional(),
  bettingContext: z.string().optional(),
  claims: z.array(claimSchema),
  conflicts: z.array(z.string()),
  uncertainty: z.array(z.string()),
  relatedQuestions: z.array(z.string()),
  sources: z.array(citationSchema),
  suggestedActions: z.array(z.string()),
  companionLine: z.string().optional(),
});

export type ResearchAnswerInput = z.infer<typeof researchAnswerSchema>;

/** Validate an unknown value against the ResearchAnswer shape. */
export function parseResearchAnswer(value: unknown) {
  return researchAnswerSchema.safeParse(value);
}
