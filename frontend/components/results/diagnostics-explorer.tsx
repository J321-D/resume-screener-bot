"use client";

import { CheckCircle2, CircleAlert, CircleHelp, Gauge } from "lucide-react";

import type { AnalysisViewModel } from "@/lib/contracts";

interface DiagnosticsExplorerProps {
  result: AnalysisViewModel;
  onSelectFinding: (findingId: string) => void;
}

const statusCopy = { pass: "Verified", review: "Review", unavailable: "Unavailable" } as const;

export function DiagnosticsExplorer({ result, onSelectFinding }: DiagnosticsExplorerProps) {
  const diagnostics = result.evidenceContract.diagnostics ?? [];
  const findingByEvidence = new Map(result.evidenceContract.findings.flatMap((finding) => (
    finding.evidence.map((evidence) => [evidence.evidence_id, finding.finding_id] as const)
  )));
  const groups = ["document", "structure", "coverage"] as const;

  return (
    <section id="diagnostics" className="diagnostics-explorer" aria-labelledby="diagnostics-title">
      <header><div><span className="mono-label">DETERMINISTIC RULE INVENTORY</span><h3 id="diagnostics-title">Analysis diagnostics</h3><p>Factual parser, structure, and lexical-coverage rules evaluated for this request—not development tests or hiring-readiness claims.</p></div><strong><Gauge size={16} /> {diagnostics.length} rules evaluated</strong></header>
      {!diagnostics.length ? <p className="evidence-empty">Diagnostics are unavailable for this compatibility response.</p> : <div className="diagnostic-groups">
        {groups.map((group) => {
          const items = diagnostics.filter((item) => item.rule_group === group);
          if (!items.length) return null;
          return <section key={group}><header><span>{group}</span><small>{items.length} rule{items.length === 1 ? "" : "s"}</small></header><ul>{items.map((item) => {
            const findingId = item.evidence_refs.map((reference) => findingByEvidence.get(reference)).find(Boolean);
            const Icon = item.status === "pass" ? CheckCircle2 : item.status === "review" ? CircleAlert : CircleHelp;
            return <li key={item.diagnostic_id} data-status={item.status}><Icon size={16} /><div><strong>{statusCopy[item.status]}</strong><span>{item.message}</span><code>{item.rule_id}{item.source_document_id ? ` · ${item.source_document_id}` : ""}</code></div>{findingId && <button type="button" onClick={() => onSelectFinding(findingId)}>Trace evidence</button>}</li>;
          })}</ul></section>;
        })}
      </div>}
    </section>
  );
}
