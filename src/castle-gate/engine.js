import path from 'node:path';
import fs from 'node:fs';

import { evaluateSecrets } from './controls/secrets.js';
import { evaluateDependencies } from './controls/dependencies.js';
import { evaluateCodeQuality } from './controls/code-quality.js';
import { evaluateAccessibility } from './controls/accessibility.js';
import { evaluatePerformance } from './controls/performance.js';
import { evaluateProduction } from './controls/production.js';
import { evaluateSeoGovernance } from './controls/seo-governance.js';
import { generateValidationId, getGitReleaseSha, createReleaseCertificate } from './certificate.js';
import { writeEvidenceArtifacts } from './report-generator.js';

export const POLICY_LEVELS = {
  C1: { name: 'Foundation', threshold: 60.0, maxGateBreakers: 0 },
  C2: { name: 'Standard', threshold: 70.0, maxGateBreakers: 0 },
  C3: { name: 'Professional', threshold: 80.0, maxGateBreakers: 0 },
  C4: { name: 'Advanced', threshold: 90.0, maxGateBreakers: 0 },
  C5: { name: 'Enterprise', threshold: 95.0, maxGateBreakers: 0 },
  C6: { name: 'Ultimate', threshold: 98.0, maxGateBreakers: 0 }
};

const DOMAIN_WEIGHTS = {
  'DOM-01': 0.25, // Secrets & Credentials (Critical)
  'DOM-02': 0.20, // Dependency Health
  'DOM-03': 0.15, // Static Code Quality
  'DOM-04': 0.15, // Accessibility & Semantics
  'DOM-05': 0.10, // Performance & Core Web Vitals
  'DOM-06': 0.10, // Build & Production Hygiene
  'DOM-07': 0.05  // SEO & Governance
};

export async function runCastleGate(targetDir, options = {}) {
  const absTargetDir = path.resolve(targetDir || '.');
  if (!fs.existsSync(absTargetDir)) {
    throw new Error(`Target directory does not exist: ${absTargetDir}`);
  }

  const levelKey = (options.level || 'C1').toUpperCase();
  const policy = POLICY_LEVELS[levelKey];
  if (!policy) {
    throw new Error(`Invalid policy level "${levelKey}". Must be one of: C1, C2, C3, C4, C5, C6.`);
  }

  const outDir = path.resolve(options.out || path.join(absTargetDir, '.castle'));

  // Evaluate all 7 domains in local runner memory
  const d1 = evaluateSecrets(absTargetDir, options);
  const d2 = evaluateDependencies(absTargetDir, options);
  const d3 = evaluateCodeQuality(absTargetDir, options);
  const d4 = evaluateAccessibility(absTargetDir, options);
  const d5 = evaluatePerformance(absTargetDir, options);
  const d6 = evaluateProduction(absTargetDir, options);
  const d7 = evaluateSeoGovernance(absTargetDir, options);

  const domains = [d1, d2, d3, d4, d5, d6, d7];

  // Calculate composite weighted score
  let totalScore = 0;
  let totalGateBreakers = 0;
  let totalSecrets = d1.summary.secretsDetected;
  const domainsSummary = {};

  for (const d of domains) {
    const weight = DOMAIN_WEIGHTS[d.domainId] || (1 / 7);
    totalScore += d.score * weight;
    totalGateBreakers += d.gateBreakersActive;
    domainsSummary[d.domainId] = {
      name: d.domainName,
      score: Number(d.score.toFixed(2)),
      status: d.status,
      findingsCount: d.findings.length
    };
  }

  totalScore = Math.min(100, Math.max(0, totalScore));

  // Determine PASS / FAIL status
  const scorePassed = totalScore >= policy.threshold;
  const gateBreakersPassed = totalGateBreakers <= policy.maxGateBreakers;
  const isPass = scorePassed && gateBreakersPassed;
  const status = isPass ? 'PASS' : 'FAIL';
  const exitCode = isPass ? 0 : 1;

  const validationId = generateValidationId();
  const releaseSha = getGitReleaseSha(absTargetDir);

  const certificate = createReleaseCertificate({
    validationId,
    policyLevel: levelKey,
    releaseSha,
    status,
    exitCode,
    score: totalScore,
    secretsDetected: totalSecrets,
    gateBreakersActive: totalGateBreakers,
    domainsSummary
  });

  const evaluationResult = {
    targetDir: absTargetDir,
    policyLevel: levelKey,
    policyThreshold: policy.threshold,
    score: totalScore,
    status,
    exitCode,
    gateBreakersActive: totalGateBreakers,
    secretsDetected: totalSecrets,
    domains
  };

  // Write evidence artifacts
  const artifacts = writeEvidenceArtifacts(outDir, evaluationResult, certificate);

  return {
    evaluation: evaluationResult,
    certificate,
    artifacts,
    exitCode
  };
}
