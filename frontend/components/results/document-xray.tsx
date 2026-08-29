"use client";

import { ChevronLeft, ChevronRight, Crosshair, FileText, Layers3, ScanLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { AnalysisFinding, AnalysisViewModel, EvidenceReference, SourceDocumentEvidence } from "@/lib/contracts";
import type { ReviewDecisions } from "@/components/review/review-state";

interface DocumentXRayProps {
  result: AnalysisViewModel;
  selectedFindingId: string | null;
  reviewDecisions: ReviewDecisions;
  onSelectFinding: (findingId: string) => void;
}

interface EvidenceOccurrence {
  finding: AnalysisFinding;
  evidence: EvidenceReference;
}

interface TextSegment {
  key: string;
  text: string;
  occurrence: EvidenceOccurrence | null;
}

const sourceName = { resume: "Résumé", job_description: "Job description" } as const;

export function segmentDocumentBlock(
  block: SourceDocumentEvidence["blocks"][number],
  occurrences: EvidenceOccurrence[],
): TextSegment[] {
  const text = Array.from(block.text);
  const boundaries = new Set([block.start, block.end]);
  for (const { evidence } of occurrences) {
    const start = Math.max(block.start, evidence.source_span.start);
    const end = Math.min(block.end, evidence.source_span.end);
    if (start < end) {
      boundaries.add(start);
      boundaries.add(end);
    }
  }
  const ordered = [...boundaries].sort((left, right) => left - right);
  return ordered.slice(0, -1).map((start, index) => {
    const end = ordered[index + 1];
    const occurrence = occurrences.find(({ evidence }) => evidence.source_span.start < end && evidence.source_span.end > start) ?? null;
    return {
      key: `${block.block_id}:${start}:${end}`,
      text: text.slice(start - block.start, end - block.start).join(""),
      occurrence,
    };
  });
}

function documentLabel(document: SourceDocumentEvidence, documents: SourceDocumentEvidence[]) {
  if (document.source_document === "job_description") return sourceName.job_description;
  const resumes = documents.filter((item) => item.source_document === "resume");
  return resumes.length > 1 ? `Résumé ${resumes.findIndex((item) => item.document_id === document.document_id) + 1}` : sourceName.resume;
}

export function DocumentXRay({ result, selectedFindingId, reviewDecisions, onSelectFinding }: DocumentXRayProps) {
  const documents = result.evidenceContract.sourceDocuments;
  const findings = result.evidenceContract.findings;
  const [documentId, setDocumentId] = useState(documents[0]?.document_id ?? "");
  const [scanner, setScanner] = useState(true);
  const [category, setCategory] = useState("all");
  const [method, setMethod] = useState("all");
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [view, setView] = useState<"sections" | "canonical">("sections");
  const selected = findings.find((finding) => finding.finding_id === selectedFindingId) ?? null;
  const document = documents.find((item) => item.document_id === documentId) ?? documents[0];
  const categories = [...new Set(findings.filter((item) => item.status === "matched").map((item) => item.category ?? "Uncategorized"))];
  const methods = [...new Set(findings.filter((item) => item.status === "matched").map((item) => item.match_method))];

  const allOccurrences = useMemo(() => findings.flatMap((finding) => (
    finding.status === "matched"
      ? finding.evidence.map((evidence) => ({ finding, evidence }))
      : []
  )), [findings]);
  const documentOccurrences = allOccurrences.filter(({ finding, evidence }) => (
    evidence.document_id === document?.document_id
    && (category === "all" || (finding.category ?? "Uncategorized") === category)
    && (method === "all" || finding.match_method === method)
    && (scanner || finding.finding_id === selectedFindingId)
  ));
  const navigable = allOccurrences.filter(({ evidence }) => evidence.document_id === document?.document_id);
  const selectedIndex = navigable.findIndex(({ finding, evidence }) => (
    activeEvidenceId ? evidence.evidence_id === activeEvidenceId : finding.finding_id === selectedFindingId
  ));
  const gaps = findings.filter((finding) => finding.status === "missing");
  const canonicalText = document?.blocks.map((block) => block.text).join("") ?? "";
  const sectionViewAvailable = Boolean(document?.sections.length);

  useEffect(() => {
    if (!sectionViewAvailable) setView("canonical");
  }, [document?.document_id, sectionViewAvailable]);

  useEffect(() => {
    if (!selected?.evidence.length) return;
    const active = selected.evidence.find((item) => item.evidence_id === activeEvidenceId) ?? selected.evidence[0];
    setActiveEvidenceId(active.evidence_id);
    const target = active.document_id;
    if (documents.some((item) => item.document_id === target)) setDocumentId(target);
  }, [activeEvidenceId, documents, selected]);

  useEffect(() => {
    if (!selectedFindingId) return;
    const root = window.document.getElementById("document-xray");
    const mark = Array.from(root?.querySelectorAll<HTMLElement>("mark[data-finding-id]") ?? [])
      .find((item) => item.dataset.findingId === selectedFindingId);
    if (!mark) return;
    mark.classList.remove("is-evidence-flash");
    void mark.offsetWidth;
    mark.classList.add("is-evidence-flash");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mark.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center", inline: "nearest" });
    const timer = window.setTimeout(() => mark.classList.remove("is-evidence-flash"), 1500);
    return () => window.clearTimeout(timer);
  }, [documentId, selectedFindingId, view]);

  function moveSelection(direction: -1 | 1) {
    if (!navigable.length) return;
    const nextIndex = selectedIndex < 0
      ? (direction > 0 ? 0 : navigable.length - 1)
      : (selectedIndex + direction + navigable.length) % navigable.length;
    setActiveEvidenceId(navigable[nextIndex].evidence.evidence_id);
    onSelectFinding(navigable[nextIndex].finding.finding_id);
  }

  function selectOccurrence(occurrence: EvidenceOccurrence) {
    setActiveEvidenceId(occurrence.evidence.evidence_id);
    onSelectFinding(occurrence.finding.finding_id);
  }

  if (result.evidenceContract.version === "unavailable" || !documents.length || documents.every((item) => !item.blocks.length)) {
    return (
      <section id="document-xray" className="document-xray" aria-labelledby="document-xray-title">
        <header><div><span className="mono-label">DOCUMENT VIEW // CONTRACT V2</span><h3 id="document-xray-title">Document X-Ray unavailable</h3></div></header>
        <p className="evidence-empty">Coverage remains valid, but this response did not include the additive canonical document-view blocks.</p>
      </section>
    );
  }

  return (
    <section id="document-xray" className="document-xray" aria-labelledby="document-xray-title">
      <header className="xray-heading">
        <div><span className="mono-label">SECTION-AWARE DOCUMENT VIEW // CONTRACT 2.0</span><h3 id="document-xray-title">Résumé &amp; job-description X-Ray</h3><p>Inspect exact parser output, conservative semantic sections, and authoritative lexical evidence. Ambiguous structure remains explicitly unavailable.</p></div>
        <button type="button" className="xray-scanner-toggle" aria-pressed={scanner} onClick={() => setScanner((current) => !current)}><ScanLine size={16} /> Scanner {scanner ? "on" : "off"}</button>
      </header>

      <div className="xray-source-tabs" role="tablist" aria-label="Document source">
        {documents.map((item) => <button type="button" role="tab" aria-selected={item.document_id === document?.document_id} key={item.document_id} onClick={() => setDocumentId(item.document_id)}><FileText size={15} /> {documentLabel(item, documents)}</button>)}
      </div>

      <div className="xray-toolbar">
        <div className="xray-view-switch" role="group" aria-label="Document view"><button type="button" aria-pressed={view === "sections"} disabled={!sectionViewAvailable} onClick={() => setView("sections")}><Layers3 size={14} /> Sections</button><button type="button" aria-pressed={view === "canonical"} onClick={() => setView("canonical")}><FileText size={14} /> Canonical text</button></div>
        <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All represented</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <label><span>Match method</span><select value={method} onChange={(event) => setMethod(event.target.value)}><option value="all">All methods</option>{methods.map((item) => <option value={item} key={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
        <div className="xray-evidence-nav" aria-label="Evidence navigation"><button type="button" aria-label="Previous evidence" onClick={() => moveSelection(-1)} disabled={!navigable.length}><ChevronLeft size={16} /></button><span>{selectedIndex >= 0 ? selectedIndex + 1 : 0} / {navigable.length}</span><button type="button" aria-label="Next evidence" onClick={() => moveSelection(1)} disabled={!navigable.length}><ChevronRight size={16} /></button></div>
      </div>

      <div className="xray-layout">
        <article className="xray-document" aria-label={`${document ? documentLabel(document, documents) : "Document"} canonical text`}>
          <div className="xray-document-meta"><span>{document?.media_type ?? "text"}</span><span>{document?.canonical_text_characters.toLocaleString()} Unicode characters</span><span>{sectionViewAvailable ? `${document?.sections.length} detected sections` : "Section model unavailable"}</span></div>
          {view === "sections" && sectionViewAvailable ? <div className="xray-sections" data-scanner={scanner ? "active" : "focused"}>
            {document?.sections.map((section) => {
              const block = { block_id: section.section_id, start: section.start, end: section.end, text: Array.from(canonicalText).slice(section.start, section.end).join(""), block_type: { value: null, unknown_reason: "not_applicable" as const }, evidence_refs: [] };
              return <section className="xray-semantic-section" key={section.section_id} data-section={section.normalized_type}><header><span>{section.normalized_type}</span><strong>{section.raw_heading}</strong><small>{section.detection_method.replaceAll("_", " ")}</small></header><div className="xray-text">{segmentDocumentBlock(block, documentOccurrences).map((segment) => segment.occurrence ? (
                <mark key={segment.key} tabIndex={0} role="button" aria-pressed={segment.occurrence.finding.finding_id === selectedFindingId} data-finding-id={segment.occurrence.finding.finding_id} data-evidence-id={segment.occurrence.evidence.evidence_id} data-method={segment.occurrence.finding.match_method} onClick={() => selectOccurrence(segment.occurrence!)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectOccurrence(segment.occurrence!); } }}>{segment.text}</mark>
              ) : <span key={segment.key}>{segment.text}</span>)}</div></section>;
            })}
          </div> : <div className="xray-text" data-scanner={scanner ? "active" : "focused"}>
            {document?.blocks.map((block) => segmentDocumentBlock(block, documentOccurrences).map((segment) => segment.occurrence ? (
              <mark
                key={segment.key}
                tabIndex={0}
                role="button"
                aria-pressed={segment.occurrence.finding.finding_id === selectedFindingId}
                data-finding-id={segment.occurrence.finding.finding_id}
                data-evidence-id={segment.occurrence.evidence.evidence_id}
                data-method={segment.occurrence.finding.match_method}
                title={`${segment.occurrence.finding.display_term} · ${segment.occurrence.finding.match_method.replaceAll("_", " ")}`}
                onClick={() => selectOccurrence(segment.occurrence!)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectOccurrence(segment.occurrence!); } }}
              >{segment.text}</mark>
            ) : <span key={segment.key}>{segment.text}</span>))}
          </div>}
        </article>

        <aside className="xray-inspector" aria-live="polite">
          <span className="mono-label">SCANNER LENS</span>
          {selected ? <><h4>{selected.display_term}</h4><dl><div><dt>Status</dt><dd>{selected.status === "matched" ? "Represented" : "Not detected"}</dd></div><div><dt>Method</dt><dd>{selected.match_method.replaceAll("_", " ")}</dd></div><div><dt>Category</dt><dd>{selected.category ?? "Uncategorized"}</dd></div><div><dt>Review</dt><dd>{reviewDecisions[selected.finding_id]?.replaceAll("_", " ") ?? "Unreviewed"}</dd></div></dl>{selected.evidence.map((evidence) => <p key={evidence.evidence_id}><Crosshair size={14} /> <strong>{evidence.matched_surface}</strong><code>[{evidence.source_span.start}, {evidence.source_span.end})</code></p>)}</> : <p>Select highlighted evidence or use Previous/Next to inspect its exact source coordinates.</p>}
          <div className="xray-gap-layer"><strong>Gap layer</strong><span>{gaps.length} not-detected findings are listed separately and never highlighted as document evidence.</span><ul>{gaps.slice(0, 6).map((finding) => <li key={finding.finding_id}><button type="button" onClick={() => onSelectFinding(finding.finding_id)}>{finding.display_term}</button></li>)}</ul></div>
        </aside>
      </div>
    </section>
  );
}
