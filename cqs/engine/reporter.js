/**
 * Castle Quality System (CQS) v1.1 — Audit Reporter & Traceability Tree Generator
 * 
 * Principle: "La metodología es la autoridad; el software únicamente la ejecuta."
 * 
 * Generates audit reports and full traceability trees:
 * Global Score -> Domain -> Subcriterion -> Control -> Evidence -> Rule
 */

'use strict';

/**
 * Generates a full markdown traceability audit report from an evaluation result.
 * 
 * @param {Object} evaluationResult Output from evaluator.evaluateCqs
 * @returns {string} Markdown formatted report
 */
function generateAuditMarkdownReport(evaluationResult) {
  const { summary, domains, target_system, auditor, timestamp, gate_breakers, governance } = evaluationResult;

  let md = `# Castle Quality Score (CQS v1.1) — Audit Evaluation Record\n\n`;
  md += `**Evaluation ID:** \`${evaluationResult.evaluation_id}\`  \n`;
  md += `**Specification Version:** \`${evaluationResult.specification_version}\` (Status: ${governance.methodology_status})  \n`;
  md += `**Target System:** ${target_system.name} (${target_system.environment || 'N/A'})  \n`;
  md += `**Auditor:** ${auditor.name} (${auditor.role})  \n`;
  md += `**Evaluation Timestamp:** ${timestamp}  \n`;
  md += `**Enterprise Calibration (TEST 04):** \`${governance.test_04_status}\`  \n\n`;

  md += `---\n\n## 1. Executive Summary & Verdict\n\n`;
  md += `* **Raw Score (Double Precision):** \`${summary.cqs_raw_score !== null ? summary.cqs_raw_score.toFixed(4) : 'UNEXECUTED'}\`\n`;
  md += `* **Display Score (Presentation):** **\`${summary.cqs_display_score !== null ? summary.cqs_display_score.toFixed(2) : 'UNEXECUTED'} / 100.00\`**\n`;
  md += `* **Total Nominal Weight:** \`${summary.total_nominal_weight.toFixed(2)}\`\n`;
  md += `* **Total Applicable Weight:** \`${summary.total_applicable_weight.toFixed(2)}\`\n`;
  md += `* **Total Excluded (N/A) Weight:** \`${summary.total_excluded_weight.toFixed(2)}\`\n`;
  md += `* **Gate Status:** **\`${summary.gate_status}\`**\n`;
  md += `* **Final Release Verdict:** **\`${summary.final_verdict}\`**\n\n`;

  if (summary.has_unexecuted_components) {
    md += `> [!NOTE]\n`;
    md += `> **Evaluation Incomplete:** Certain controls or domains were UNEXECUTED. The current score represents a partial evaluation cycle.\n\n`;
  }

  md += `---\n\n## 2. Gate-Breakers Evaluation (GB-01 to GB-05)\n\n`;
  md += `| Code | Gate Name | Triggered | Details |\n`;
  md += `|---|---|:---:|---|\n`;
  for (const gb of gate_breakers.evaluated_gates) {
    const icon = gb.triggered ? '🚨 BLOCKED' : '✅ CLEARED';
    md += `| \`${gb.code}\` | ${gb.name} | **${icon}** | ${gb.details} |\n`;
  }

  md += `\n---\n\n## 3. Official 7-Domain Results Summary\n\n`;
  md += `| Domain | Name | Nominal Weight | Applicable Weight | Domain Score | Status |\n`;
  md += `|---|---|:---:|:---:|:---:|:---:|\n`;
  for (const d of domains) {
    const scoreStr = d.normalized_score !== null ? (d.normalized_score * 100).toFixed(2) + '%' : 'N/A';
    md += `| **\`${d.domain_code}\`** | ${d.name} | **${d.nominal_weight.toFixed(2)}** | ${d.applicable_weight.toFixed(2)} | **${scoreStr}** | \`${d.status}\` |\n`;
  }

  md += `\n---\n\n## 4. Full Traceability Tree & Atomic Control Results\n\n`;

  for (const d of domains) {
    md += `### Domain: \`${d.domain_code}\` — ${d.name} (Nominal: ${d.nominal_weight.toFixed(1)} pts)\n\n`;

    for (const sub of d.subcriteria) {
      const subScoreStr = sub.normalized_score !== null ? (sub.normalized_score * 100).toFixed(2) + '%' : 'N/A';
      md += `#### Subcriterion: \`${sub.subcriterion_code}\` — ${sub.name} (Nominal: ${sub.nominal_weight.toFixed(2)}, Applicable: ${sub.applicable_weight.toFixed(2)}, Score: ${subScoreStr}, Status: \`${sub.status}\`)\n\n`;
      
      md += `| Control ID | Control Name | Origin | Weight | Status | Score | Evidence / Notes |\n`;
      md += `|---|---|:---:|:---:|:---:|:---:|---|\n`;

      for (const c of sub.controls) {
        const cScore = c.score !== null ? c.score.toFixed(1) : 'N/A';
        const evNotes = c.notes || (c.evidence ? JSON.stringify(c.evidence) : 'None');
        md += `| \`${c.control_id}\` | ${c.name} | \`${c.origin_classification}\` | ${c.nominal_weight.toFixed(2)} | **\`${c.status}\`** | ${cScore} | ${evNotes} |\n`;
      }
      md += `\n`;
    }
  }

  md += `---\n\n## 5. Open Methodological Decisions\n\n`;
  for (const omd of governance.open_methodological_decisions) {
    md += `> [!WARNING]\n`;
    md += `> **${omd.id}: ${omd.title}**  \n`;
    md += `> Status: \`${omd.status}\` (Active in Engine: \`${omd.active_in_engine}\`)  \n`;
    md += `> ${omd.description}\n\n`;
  }

  return md;
}

module.exports = {
  generateAuditMarkdownReport
};
