export const analysis = {
  analysis_mode: "Skills-focused analysis" as const,
  coverage: { score: 50, matched: 1, missing: 1, total: 2, label: "Categorized Keyword Coverage" },
  matched_terms: [{ term: "quality control", count: 1, category: "Quality/regulatory" }],
  missing_terms: [{ term: "SQL", count: 2, category: "Tools/software" }],
  categories: [{ category: "Tools/software", matched: 0, total: 1, score: 0, display_value: "0.0%", included_in_primary: true }],
  normalized_matches: [{ concept: "quality control", resume_term: "QC", job_term: "quality control" }],
  metadata: { resume_label: "Pasted résumé", resume_count: 1, input_mode: "pasted_text", analyzed_at: "2026-08-13T12:00:00Z" },
  warnings: [],
};

export const v2Payload = {
  contract_version: "2.0" as const,
  analysis,
  source_documents: [
    { document_id: "resume_1", source_document: "resume" as const, media_type: "text/plain", canonical_text_characters: 11, offset_basis: "server_canonical_extracted_text" as const, document_structure_metadata: { value: null, unknown_reason: "parser_limitation" as const }, formatting_metadata: { value: null, unknown_reason: "parser_limitation" as const }, blocks: [{ block_id: "block_resume", start: 0, end: 11, text: "QC Python x", block_type: { value: null, unknown_reason: "parser_limitation" as const }, evidence_refs: ["evidence_qc"] }] },
    { document_id: "job_description_1", source_document: "job_description" as const, media_type: "text/plain", canonical_text_characters: 19, offset_basis: "server_canonical_extracted_text" as const, document_structure_metadata: { value: null, unknown_reason: "parser_limitation" as const }, formatting_metadata: { value: null, unknown_reason: "parser_limitation" as const }, blocks: [{ block_id: "block_job", start: 0, end: 19, text: "quality control SQL", block_type: { value: null, unknown_reason: "parser_limitation" as const }, evidence_refs: ["evidence_sql"] }] },
  ],
  findings: [
    {
      finding_id: "finding_quality", comparison_key: "skills_focused.concept_coverage:quality control", rule_id: "skills_focused.concept_coverage" as const, category: "Quality/regulatory", status: "matched" as const, reason: "curated_normalization" as const, display_term: "quality control", normalized_term: "quality control", match_method: "curated_synonym" as const,
      evidence: [{ evidence_id: "evidence_qc", source_document: "resume" as const, document_id: "resume_1", source_section: { value: null, unknown_reason: "parser_limitation" as const }, source_span: { start: 0, end: 2, unit: "unicode_code_point" as const }, matched_surface: "QC", normalized_term: "quality control" }], unavailable_evidence_reason: null,
    },
    {
      finding_id: "finding_sql", comparison_key: "skills_focused.concept_coverage:sql", rule_id: "skills_focused.concept_coverage" as const, category: "Tools/software", status: "missing" as const, reason: "not_detected" as const, display_term: "SQL", normalized_term: "sql", match_method: "not_detected" as const,
      evidence: [{ evidence_id: "evidence_sql", source_document: "job_description" as const, document_id: "job_description_1", source_section: { value: null, unknown_reason: "parser_limitation" as const }, source_span: { start: 16, end: 19, unit: "unicode_code_point" as const }, matched_surface: "SQL", normalized_term: "sql" }], unavailable_evidence_reason: null,
    },
  ],
};
