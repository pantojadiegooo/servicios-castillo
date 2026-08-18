/**
 * Castle Quality System (CQS) v1.1 — Evaluation Engine
 * 
 * Principle: "La metodología es la autoridad; el software únicamente la ejecuta."
 * 
 * Executes the mandatory normative evaluation cycle:
 * Specification -> Evidence -> Evaluation -> Control Result -> 
 * Subcriterion Score -> Domain Score -> Global CQS Score -> Gate
 */

'use strict';

const path = require('path');
const fs = require('fs');

const {
  STATUS_PASS,
  STATUS_FAIL,
  STATUS_NA,
  STATUS_UNEXECUTED,
  evaluateControl,
  calculateSubcriterionScore,
  calculateDomainScore,
  calculateGlobalScore
} = require('../scoring/scoring-model');

const { processControlEvidence } = require('../evidence/evidence-model');
const { validateCqsIntegrity, validateEvidencePayload } = require('./validator');

/**
 * Loads the frozen CQS v1.1 normative assets.
 * 
 * @returns {Object} { specification, controls, domains, subcriteria, invariants }
 */
function loadNormativeAssets() {
  const baseDir = path.resolve(__dirname, '..');
  
  const specification = JSON.parse(fs.readFileSync(path.join(baseDir, 'specification', 'specification.json'), 'utf8'));
  const controls = JSON.parse(fs.readFileSync(path.join(baseDir, 'registry', 'controls.json'), 'utf8'));
  const domainData = JSON.parse(fs.readFileSync(path.join(baseDir, 'registry', 'domains.json'), 'utf8'));
  const invariants = JSON.parse(fs.readFileSync(path.join(baseDir, 'governance', 'invariants.json'), 'utf8'));

  return {
    specification,
    controls,
    domains: domainData.domains,
    subcriteria: domainData.subcriteria,
    invariants
  };
}

/**
 * Executes a full CQS evaluation on a target system using submitted evidence.
 * 
 * @param {Object} evaluationInput { target_system, auditor, evidence, gate_evidence }
 * @returns {Object} Complete evaluation result with full audit trail
 */
function evaluateCqs(evaluationInput) {
  // Step 1: Pre-Execution Methodological Integrity Validation
  const integrityReport = validateCqsIntegrity();
  if (integrityReport.integrity !== 'PASS') {
    throw new Error(`[CQS Evaluator] Refusing execution: Methodological integrity validation failed with errors: ${integrityReport.errors.join('; ')}`);
  }

  const assets = loadNormativeAssets();
  const { controls, domains, subcriteria } = assets;

  // Step 2: Validate Input Evidence Payload
  const rawEvidence = (evaluationInput && evaluationInput.evidence) ? evaluationInput.evidence : {};
  const evidenceValidation = validateEvidencePayload(rawEvidence, controls);
  if (!evidenceValidation.valid) {
    throw new Error(`[CQS Evaluator] Evidence payload rejected: ${evidenceValidation.errors.join('; ')}`);
  }

  const submittedControls = rawEvidence.controls || {};

  // Step 3: Level 1 — Atomic Control Evaluation (c_i)
  const controlResults = {};

  for (const ctrl of controls) {
    const cid = ctrl.control_id;
    const ctrlEvidence = submittedControls[cid] || null;
    
    // Process evidence through evidence model (enforcing Lab/Field rules)
    const processed = processControlEvidence(ctrl, ctrlEvidence);
    
    // Evaluate control mathematically
    const evaluated = evaluateControl(ctrl, processed.status, processed.evidence);
    evaluated.notes = processed.notes;
    
    controlResults[cid] = evaluated;
  }

  // Step 4: Level 2 — Subcriteria Scoring (Sub_j)
  const subcriterionResults = {};

  for (const [subCode, sub] of Object.entries(subcriteria)) {
    const childControlResults = sub.controls.map(cid => controlResults[cid]).filter(Boolean);
    const subResult = calculateSubcriterionScore(sub, childControlResults);
    subcriterionResults[subCode] = subResult;
  }

  // Step 5: Level 3 — Official Domain Scoring (Dom_k)
  const domainResults = [];

  for (const [domCode, dom] of Object.entries(domains)) {
    const childSubResults = dom.subcriteria.map(subCode => subcriterionResults[subCode]).filter(Boolean);
    const domResult = calculateDomainScore(dom, childSubResults);
    domainResults.push(domResult);
  }

  // Step 6: Level 4 — Global CQS Score Calculation
  const globalScoreResult = calculateGlobalScore(domainResults);

  // Step 7: Gate Evaluation (GB-01 to GB-05)
  const gateEvidence = (evaluationInput && evaluationInput.gate_evidence) ? evaluationInput.gate_evidence : {};
  const evaluatedGates = [
    { code: 'GB-01', name: 'Insecure Transport / Plaintext Transmission', triggered: gateEvidence['GB-01'] === true, details: gateEvidence['GB-01_details'] || 'Normal' },
    { code: 'GB-02', name: 'Exposed Credentials / Hardcoded Secrets', triggered: gateEvidence['GB-02'] === true, details: gateEvidence['GB-02_details'] || 'Normal' },
    { code: 'GB-03', name: 'Critical Injection Vulnerability', triggered: gateEvidence['GB-03'] === true, details: gateEvidence['GB-03_details'] || 'Normal' },
    { code: 'GB-04', name: 'Core Flow Disruption / Fatal Crash', triggered: gateEvidence['GB-04'] === true, details: gateEvidence['GB-04_details'] || 'Normal' },
    { code: 'GB-05', name: 'Critical Accessibility Blocker', triggered: gateEvidence['GB-05'] === true, details: gateEvidence['GB-05_details'] || 'Normal' }
  ];

  const anyGateTriggered = evaluatedGates.some(g => g.triggered);
  const gateStatus = anyGateTriggered ? 'BLOCKED' : 'CLEARED';

  // Final Verdict
  let finalVerdict;
  if (gateStatus === 'BLOCKED') {
    finalVerdict = 'FAIL_BLOCKED';
  } else if (globalScoreResult.has_unexecuted_components) {
    finalVerdict = 'CYCLE_INCOMPLETE_UNEXECUTED';
  } else if (globalScoreResult.cqs_raw_score >= 85.0) {
    finalVerdict = 'PASS_RELEASE';
  } else if (globalScoreResult.cqs_raw_score >= 70.0) {
    finalVerdict = 'CONDITIONAL_APPROVAL';
  } else {
    finalVerdict = 'FAIL_BLOCKED';
  }

  return {
    evaluation_id: (evaluationInput && evaluationInput.evaluation_id) || `EVAL-${Date.now()}`,
    specification_version: '1.1.0',
    status: 'Ratified',
    target_system: (evaluationInput && evaluationInput.target_system) || {
      name: 'Unspecified Target',
      environment: 'evaluation'
    },
    auditor: (evaluationInput && evaluationInput.auditor) || {
      name: 'Automated Evaluation Engine',
      role: 'Quality Assurance Auditor'
    },
    timestamp: new Date().toISOString(),
    summary: {
      cqs_raw_score: globalScoreResult.cqs_raw_score,
      cqs_display_score: globalScoreResult.cqs_display_score,
      total_nominal_weight: globalScoreResult.total_nominal_weight,
      total_applicable_weight: globalScoreResult.total_applicable_weight,
      total_excluded_weight: globalScoreResult.total_excluded_weight,
      total_atomic_nominal_weight: globalScoreResult.total_atomic_nominal_weight,
      total_atomic_applicable_weight: globalScoreResult.total_atomic_applicable_weight,
      total_atomic_excluded_weight: globalScoreResult.total_atomic_excluded_weight,
      has_unexecuted_components: globalScoreResult.has_unexecuted_components,
      gate_status: gateStatus,
      final_verdict: finalVerdict
    },
    domains: globalScoreResult.domains,
    gate_breakers: {
      status: gateStatus,
      evaluated_gates: evaluatedGates
    },
    governance: {
      methodology_status: 'FROZEN',
      test_04_status: 'Pending / UNEXECUTED',
      open_methodological_decisions: assets.invariants.open_methodological_decisions
    }
  };
}

module.exports = {
  loadNormativeAssets,
  evaluateCqs
};
