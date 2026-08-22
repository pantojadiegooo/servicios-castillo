import fs from 'node:fs';
import path from 'node:path';

export function generateHtmlReport(result, cert) {
  const isPass = result.status === 'PASS';
  const statusColor = isPass ? '#00E599' : '#FF3B5C';
  const statusBg = isPass ? 'rgba(0, 229, 153, 0.12)' : 'rgba(255, 59, 92, 0.12)';

  const domainsHtml = result.domains.map(d => {
    const domainPass = d.status === 'PASS';
    const dColor = domainPass ? '#00E599' : '#FF3B5C';
    const findingsHtml = d.findings.length > 0
      ? `<div style="margin-top: 12px; border-top: 1px solid #222B3A; padding-top: 10px;">
          <strong style="font-size: 11px; text-transform: uppercase; color: #94A3B8;">Findings (${d.findings.length}):</strong>
          <ul style="margin: 6px 0 0 0; padding-left: 16px; font-size: 12px; color: #CBD5E1;">
            ${d.findings.map(f => `
              <li style="margin-bottom: 6px;">
                <span style="color: ${f.severity === 'CRITICAL' ? '#FF3B5C' : '#FFB800'}; font-weight: bold;">[${f.severity}]</span>
                ${f.file ? `<code>${f.file}${f.line ? `:${f.line}` : ''}</code> — ` : ''}
                ${f.name || f.rule || f.id}
                ${f.snippet ? `<br><code style="background: #06080C; padding: 2px 6px; border-radius: 3px; font-size: 11px; color: #94A3B8;">${f.snippet}</code>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>`
      : `<p style="margin: 8px 0 0 0; font-size: 12px; color: #00E599;">All controls satisfied nominal baseline without findings.</p>`;

    return `
      <div style="background: #0E121B; border: 1px solid #222B3A; border-radius: 6px; padding: 16px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-family: monospace; font-size: 11px; color: #00D2FF; font-weight: bold;">${d.domainId}</span>
            <h3 style="margin: 2px 0 0 0; font-size: 14px; color: #F8FAFC;">${d.domainName}</h3>
          </div>
          <div style="text-align: right;">
            <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: ${dColor};">${d.score.toFixed(1)} / 100</span>
            <span style="display: block; font-size: 10px; text-transform: uppercase; font-weight: bold; color: ${dColor};">${d.status}</span>
          </div>
        </div>
        ${findingsHtml}
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Castle Gate Compliance Report — ${cert.validation_id}</title>
  <style>
    body {
      background: #06080C;
      color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 32px 16px;
      line-height: 1.5;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .header-card {
      background: #0E121B;
      border: 1px solid #222B3A;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 0.05em;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 20px;
    }
    @media (max-width: 680px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .kpi-box {
      background: #06080C;
      border: 1px solid #222B3A;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    .kpi-val {
      font-size: 20px;
      font-weight: bold;
      font-family: monospace;
      margin-top: 4px;
    }
    .kpi-lbl {
      font-size: 10px;
      text-transform: uppercase;
      color: #94A3B8;
      font-family: monospace;
    }
    code {
      font-family: "JetBrains Mono", "SF Mono", Consolas, monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
        <div>
          <span style="font-family: monospace; font-size: 11px; color: #00D2FF; letter-spacing: 0.08em; text-transform: uppercase;">
            GRUPO CASTILLO • QUALITY &amp; SECURITY GATE (CQS v1.1)
          </span>
          <h1 style="margin: 4px 0 6px 0; font-size: 22px; color: #F8FAFC;">
            Release Compliance Report
          </h1>
          <div style="font-family: monospace; font-size: 12px; color: #94A3B8;">
            ID: <strong style="color: #00D2FF;">${cert.validation_id}</strong> | 
            Policy: <strong>${cert.policy_level}</strong> | 
            Timestamp: ${cert.evaluation_timestamp_utc}
          </div>
        </div>
        <div>
          <span class="badge" style="background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor}; font-size: 14px; padding: 6px 14px;">
            ${cert.status} (Exit Code ${cert.exit_code})
          </span>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-box">
          <div class="kpi-lbl">Composite Score</div>
          <div class="kpi-val" style="color: ${statusColor};">${cert.score.toFixed(1)} / 100</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-lbl">Gate Breakers</div>
          <div class="kpi-val" style="color: ${cert.gate_breakers_active === 0 ? '#00E599' : '#FF3B5C'};">
            ${cert.gate_breakers_active} Active
          </div>
        </div>
        <div class="kpi-box">
          <div class="kpi-lbl">Secrets Detected</div>
          <div class="kpi-val" style="color: ${cert.secrets_detected === 0 ? '#00E599' : '#FF3B5C'};">
            ${cert.secrets_detected}
          </div>
        </div>
        <div class="kpi-box">
          <div class="kpi-lbl">Domains Audited</div>
          <div class="kpi-val" style="color: #00D2FF;">
            ${result.domains.length} / 7
          </div>
        </div>
      </div>

      <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #222B3A; font-size: 11px; font-family: monospace; color: #94A3B8; word-break: break-all;">
        <strong>Target Release SHA:</strong> ${cert.target_release_sha}<br>
        <strong>Signature Digest (SHA-256):</strong> ${cert.signature_digest_sha256}
      </div>
    </div>

    <h2 style="font-size: 16px; margin: 24px 0 12px 0; color: #CBD5E1; text-transform: uppercase; letter-spacing: 0.05em; font-family: monospace;">
      Domain Inspection Results
    </h2>

    ${domainsHtml}

    <div style="margin-top: 32px; text-align: center; font-size: 11px; color: #64748B; font-family: monospace;">
      Castle Quality Standard (CQS v1.1) • Evaluation executed locally in memory • Client owns 100% of software assets.
    </div>
  </div>
</body>
</html>`;
}

export function writeEvidenceArtifacts(outDir, result, cert) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Release Certificate JSON
  const certPath = path.join(outDir, 'release-certificate.json');
  fs.writeFileSync(certPath, JSON.stringify(cert, null, 2), 'utf8');

  // 2. Full Compliance Report JSON
  const reportJsonPath = path.join(outDir, 'compliance-report.json');
  fs.writeFileSync(reportJsonPath, JSON.stringify({ certificate: cert, evaluation: result }, null, 2), 'utf8');

  // 3. Standalone HTML Report
  const htmlContent = generateHtmlReport(result, cert);
  const htmlPath = path.join(outDir, 'compliance-report.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  return {
    certPath,
    reportJsonPath,
    htmlPath
  };
}
