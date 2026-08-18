/**
 * Castle Security & Quality Gate — Standalone HTML Compliance Report Generator
 * 
 * Generates an interactive, zero-dependency, self-contained HTML audit artifact
 * (compliance-report.html) for developers, CTOs, CISOs, and auditors.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function generateComplianceReportHtml(data) {
  const {
    target_system = { name: 'Target System', environment: 'production', commit_sha: 'unspecified' },
    cqs_summary = { cqs_display_score: 0, raw_score: 0, final_verdict: 'CYCLE_INCOMPLETE_UNEXECUTED' },
    domains = [],
    gate_decision = { gate_state: 'UNKNOWN', gate_level: 'C1', blockers: [], exit_code: 2 },
    gate_breakers = { status: 'CLEARED', evaluated_gates: [] },
    provenance = { payload_sha256: 'N/A' },
    certificate_id = null
  } = data;

  const stateColor = gate_decision.gate_state === 'PASSED' 
    ? '#10b981' 
    : gate_decision.gate_state === 'BLOCKED' 
      ? '#ef4444' 
      : '#f59e0b';

  const stateBg = gate_decision.gate_state === 'PASSED' 
    ? '#064e3b' 
    : gate_decision.gate_state === 'BLOCKED' 
      ? '#7f1d1d' 
      : '#78350f';

  const domainsHtml = domains.map(d => {
    const pct = d.status === 'UNEXECUTED' ? 0 : Math.round((d.applicable_weight > 0 ? (d.normalized_score || 0) : 0) * 100);
    const badgeColor = d.status === 'PASS' ? '#10b981' : d.status === 'FAIL' ? '#ef4444' : '#6b7280';
    return `
      <div class="domain-card">
        <div class="domain-header">
          <span class="domain-name">${d.name} (${d.domain_code})</span>
          <span class="domain-badge" style="background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}44;">${d.status}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${pct}%; background: ${badgeColor};"></div>
        </div>
        <div class="domain-metrics">
          <span>Nominal: ${d.nominal_weight} pts</span>
          <span>Applicable: ${d.applicable_weight} pts</span>
          <span>Score: ${pct}%</span>
        </div>
      </div>
    `;
  }).join('');

  const blockersHtml = (gate_decision.blockers && gate_decision.blockers.length > 0)
    ? gate_decision.blockers.map((b, idx) => `
        <div class="blocker-item">
          <div class="blocker-num">${idx + 1}</div>
          <div class="blocker-content">
            <div class="blocker-code">${escapeHtml(b.code || 'BLOCKER')}</div>
            <div class="blocker-desc">${escapeHtml(b.details || JSON.stringify(b))}</div>
          </div>
        </div>
      `).join('')
    : '<div class="no-blockers">✓ No active gate blockers or deficiencies detected.</div>';

  const breakersHtml = (gate_breakers.evaluated_gates || []).map(g => {
    const isTriggered = g.triggered;
    const statusColor = isTriggered ? '#ef4444' : '#10b981';
    const statusText = isTriggered ? 'TRIGGERED (FAIL)' : 'CLEARED';
    return `
      <div class="breaker-item">
        <span class="breaker-dot" style="background: ${statusColor};"></span>
        <span class="breaker-code"><strong>${g.code}</strong>: ${escapeHtml(g.name)}</span>
        <span class="breaker-status" style="color: ${statusColor};">${statusText}</span>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Castle Gate Compliance Report — ${escapeHtml(target_system.name)}</title>
  <style>
    :root {
      --bg-primary: #0f172a;
      --bg-surface: #1e293b;
      --bg-elevated: #334155;
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --border-color: #334155;
      --accent: #38bdf8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: var(--bg-primary); color: var(--text-primary); padding: 2rem; line-height: 1.5; }
    .container { max-width: 1000px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; }
    .header-title h1 { font-size: 1.75rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
    .header-title p { color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.25rem; }
    .state-badge { padding: 0.5rem 1.25rem; border-radius: 9999px; font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid ${stateColor}; background: ${stateBg}; color: ${stateColor}; }
    .summary-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; margin-bottom: 2rem; }
    .score-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .score-number { font-size: 3.5rem; font-weight: 800; color: #fff; line-height: 1; margin: 0.5rem 0; }
    .score-label { color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .meta-item label { display: block; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-item value { display: block; font-size: 0.95rem; font-weight: 600; color: #f1f5f9; word-break: break-all; }
    .section-title { font-size: 1.15rem; font-weight: 600; margin: 2rem 0 1rem; color: #f1f5f9; display: flex; align-items: center; gap: 0.5rem; }
    .domains-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .domain-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; }
    .domain-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .domain-name { font-weight: 600; font-size: 0.9rem; }
    .domain-badge { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 4px; }
    .progress-bar-bg { width: 100%; height: 6px; background: var(--bg-elevated); border-radius: 3px; overflow: hidden; margin-bottom: 0.5rem; }
    .progress-bar-fill { height: 100%; transition: width 0.3s ease; }
    .domain-metrics { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); }
    .blockers-box { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem; }
    .blocker-item { display: flex; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); }
    .blocker-item:last-child { border-bottom: none; }
    .blocker-num { background: #ef444422; color: #ef4444; border: 1px solid #ef444444; width: 24px; height: 24px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
    .blocker-code { font-weight: 700; font-size: 0.85rem; color: #f87171; }
    .blocker-desc { font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.15rem; }
    .no-blockers { color: #10b981; font-weight: 600; font-size: 0.9rem; padding: 0.5rem 0; }
    .breakers-box { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; }
    .breaker-item { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #33415544; font-size: 0.85rem; }
    .breaker-item:last-child { border-bottom: none; }
    .breaker-dot { width: 8px; height: 8px; border-radius: 4px; margin-right: 0.5rem; display: inline-block; }
    footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-secondary); }
    .seal-hash { font-family: monospace; font-size: 0.75rem; background: var(--bg-surface); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-title">
        <h1>Castle Security & Quality Gate</h1>
        <p>Compliance & Release Authorization Audit Report</p>
      </div>
      <div class="state-badge">${escapeHtml(gate_decision.gate_state)}</div>
    </header>

    <div class="summary-grid">
      <div class="score-card">
        <span class="score-label">CQS Display Score</span>
        <div class="score-number">${escapeHtml(String(cqs_summary.cqs_display_score))}</div>
        <span class="score-label">Enforced Level: <strong>${escapeHtml(gate_decision.gate_level)}</strong></span>
      </div>
      <div class="meta-card">
        <div class="meta-item">
          <label>Target Project</label>
          <value>${escapeHtml(target_system.name)}</value>
        </div>
        <div class="meta-item">
          <label>Environment</label>
          <value>${escapeHtml(target_system.environment)}</value>
        </div>
        <div class="meta-item">
          <label>Commit SHA</label>
          <value>${escapeHtml(target_system.commit_sha || 'N/A')}</value>
        </div>
        <div class="meta-item">
          <label>Exit Code</label>
          <value>${gate_decision.exit_code}</value>
        </div>
        <div class="meta-item">
          <label>CQS Methodology</label>
          <value>v1.1 (FROZEN / SINGLE SOURCE OF TRUTH)</value>
        </div>
        <div class="meta-item">
          <label>Policy Baseline</label>
          <value>1.0.0-ratified</value>
        </div>
      </div>
    </div>

    <div class="section-title">Gate Breakers Verification (GB-01 .. GB-05)</div>
    <div class="breakers-box">
      ${breakersHtml}
    </div>

    <div class="section-title">Domain Performance Breakdown (7 Official Domains)</div>
    <div class="domains-grid">
      ${domainsHtml}
    </div>

    <div class="section-title">Gate Blockers & Deficiencies</div>
    <div class="blockers-box">
      ${blockersHtml}
    </div>

    <footer>
      <div>Generated by <strong>Castle Gate Engine v1.0.0</strong> | Grupo Castillo</div>
      <div>Provenance Digest: <span class="seal-hash">${escapeHtml((provenance.payload_sha256 || 'DIRECT').substring(0, 24))}...</span></div>
    </footer>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  generateComplianceReportHtml
};
