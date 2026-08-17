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

const unknownReasonSchema = z.enum([
  "not_available",
  "not_applicable",
  "not_detected",
  "unsupported_source",
  "ambiguous",
  "parser_limitation",
]);

const unknownMetadataSchema = z.object({
  value: z.null(),
  unknown_reason: unknownReasonSchema,
});

const sectionReferenceSchema = z.object({
  section_id: z.string(),
  raw_heading: z.string().min(1),
  normalized_type: z.enum(["summary", "experience", "education", "skills", "projects", "research", "publications", "certifications", "other"]),
  detection_method: z.enum(["docx_heading_style", "pdf_emphasized_text_line", "standalone_known_heading"]),
});

const sourceSpanSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  unit: z.literal("unicode_code_point"),
}).refine((span) => span.end > span.start);

const documentSectionSchema = sectionReferenceSchema.extend({
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  heading_span: sourceSpanSchema,
}).refine((section) => (
  section.end > section.start
  && section.heading_span.start >= section.start
  && section.heading_span.end <= section.end
), { message: "Section ranges must contain their heading" });

const sectionDetectionMetadataSchema = z.object({
  availability: z.literal("detected"),
  section_count: z.number().int().positive(),
  detection_methods: z.array(z.string()).min(1),
});

const evidenceReferenceSchema = z.object({
  evidence_id: z.string(),
  source_document: z.enum(["resume", "job_description"]),
  document_id: z.string(),
  source_section: z.union([sectionReferenceSchema, unknownMetadataSchema]),
  source_span: sourceSpanSchema,
  matched_surface: z.string().min(1),
  normalized_term: z.string(),
});

const findingSchema = z.object({
  finding_id: z.string(),
  comparison_key: z.string(),
  rule_id: z.enum(["full_lexical.token_coverage", "skills_focused.concept_coverage"]),
  category: z.string().nullable(),
  status: z.enum(["matched", "missing"]),
  reason: z.enum(["exact_match", "curated_normalization", "not_detected"]),
  display_term: z.string(),
  normalized_term: z.string(),
  match_method: z.enum(["exact", "documented_phrase", "curated_synonym", "not_detected"]),
  evidence: z.array(evidenceReferenceSchema),
  unavailable_evidence_reason: unknownReasonSchema.nullable(),
});

const diagnosticFindingSchema = z.object({
  diagnostic_id: z.string(),
  rule_id: z.enum(["document.text_extracted", "document.semantic_sections", "document.repeated_section_type", "coverage.threshold_30_percent", "coverage.opportunities_present"]),
  rule_group: z.enum(["document", "structure", "coverage"]),
  status: z.enum(["pass", "review", "unavailable"]),
  reason_code: z.string(),
  source_document_id: z.string().nullable().default(null),
  evidence_refs: z.array(z.string()).default([]),
  message: z.string(),
});

const documentBlockSchema = z.object({
  block_id: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  text: z.string(),
  block_type: unknownMetadataSchema,
  evidence_refs: z.array(z.string()),
}).refine((block) => block.end > block.start && block.end - block.start === [...block.text].length, {
  message: "Document block offsets must match its Unicode text length",
});

const sourceDocumentSchema = z.object({
  document_id: z.string(),
  source_document: z.enum(["resume", "job_description"]),
  media_type: z.string().nullable(),
  canonical_text_characters: z.number().int().nonnegative(),
  offset_basis: z.literal("server_canonical_extracted_text"),
  document_structure_metadata: z.union([sectionDetectionMetadataSchema, unknownMetadataSchema]),
  formatting_metadata: unknownMetadataSchema,
  // The default keeps a rolling frontend deployment compatible with an older
  // v2 API response. New API responses always return the complete block list.
  blocks: z.array(documentBlockSchema).default([]),
  sections: z.array(documentSectionSchema).default([]),
}).superRefine((document, context) => {
  if (!document.blocks.length) return;
  let expectedStart = 0;
  for (const block of document.blocks) {
    if (block.start !== expectedStart) {
      context.addIssue({ code: "custom", message: "Document blocks must be contiguous" });
      return;
    }
    expectedStart = block.end;
  }
  if (expectedStart !== document.canonical_text_characters) {
    context.addIssue({ code: "custom", message: "Document blocks must reconstruct the canonical document" });
  }
  for (const section of document.sections) {
    if (section.end > document.canonical_text_characters) {
      context.addIssue({ code: "custom", message: "Section exceeds canonical document range" });
    }
  }
});

export const analysisV2ResponseSchema = z.object({
  contract_version: z.literal("2.0"),
  analysis: analysisResponseSchema,
  source_documents: z.array(sourceDocumentSchema),
  findings: z.array(findingSchema),
  diagnostics: z.array(diagnosticFindingSchema).default([]),
});

export type EvidenceReference = z.infer<typeof evidenceReferenceSchema>;
export type AnalysisFinding = z.infer<typeof findingSchema>;
export type SourceDocumentEvidence = z.infer<typeof analysisV2ResponseSchema>["source_documents"][number];
export type AnalysisV2Response = z.infer<typeof analysisV2ResponseSchema>;
export type DiagnosticFinding = z.infer<typeof diagnosticFindingSchema>;

export interface AnalysisViewModel extends AnalysisResponse {
  evidenceContract: {
    version: "2.0" | "unavailable";
    findings: AnalysisFinding[];
    sourceDocuments: SourceDocumentEvidence[];
    diagnostics?: DiagnosticFinding[];
  };
}

export function analysisViewModel(payload: AnalysisV2Response | AnalysisResponse): AnalysisViewModel {
  if ("contract_version" in payload) {
    return {
      ...payload.analysis,
      evidenceContract: {
        version: payload.contract_version,
        findings: payload.findings,
        sourceDocuments: payload.source_documents,
        diagnostics: payload.diagnostics,
      },
    };
  }
  return {
    ...payload,
    evidenceContract: { version: "unavailable", findings: [], sourceDocuments: [], diagnostics: [] },
  };
}

export function findingForTerm(
  result: AnalysisViewModel,
  status: AnalysisFinding["status"],
  term: AnalysisResponse["matched_terms"][number],
): AnalysisFinding | undefined {
  return result.evidenceContract.findings.find((finding) => (
    finding.status === status
    && finding.display_term === term.term
    && finding.category === term.category
  ));
}

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
