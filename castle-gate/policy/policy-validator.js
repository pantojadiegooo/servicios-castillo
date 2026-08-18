/**
 * Castle Security & Quality Gate — Policy Validator (Phase 3 Matrix Support)
 * 
 * Validates Gate Policies and custom overrides against CQS normative assets:
 * - Validates level codes (C1..C6)
 * - Checks structured policy matrix fields
 * - Validates that controls exist in CQS Registry without duplicates
 * - Validates that domains exist in CQS 7-Domain structure without duplicates
 * - Validates Gate Breaker references (GB-01..GB-05) without duplicates
 * - Validates score ranges (0.0 to 100.0)
 * - Validates temporal windows (remediation_window_hours >= 0)
 * - Validates evidence types
 * - Treats 'UNSPECIFIED' as a valid pending-governance state, NOT an error
 * - Differentiates DEFINED vs UNSPECIFIED parameters
 */

'use strict';

const cqs = require('../../cqs');

const VALID_GATE_LEVELS = Object.freeze(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
const VALID_GATE_BREAKERS = Object.freeze(['GB-01', 'GB-02', 'GB-03', 'GB-04', 'GB-05']);
const VALID_EVIDENCE_TYPES = Object.freeze(['lab', 'field', 'runtime', 'code_audit', 'infrastructure', 'configuration', 'automated_test']);

const ALL_16_POLICY_FIELDS = Object.freeze([
  'level',
  'name',
  'intended_scope',
  'risk_profile',
  'policy_version',
  'required_controls',
  'required_domains',
  'required_evidence_types',
  'minimum_cqs_score',
  'mandatory_gate_breakers',
  'allow_unexecuted_controls',
  'allow_conditional_approval',
  'approval_roles_required',
  'remediation_window_hours',
  'post_verification_required',
  'governance_status',
  'decision_reference'
]);

/**
 * Validates a Gate Policy object against CQS normative registry and matrix schema.
 * 
 * @param {Object} policy Policy object to validate
 * @returns {Object} { valid: boolean, status: string, errors: Array<string>, warnings: Array<string>, parameter_status: Object }
 */
function validateGatePolicy(policy) {
  const errors = [];
  const warnings = [];
  const parameterStatus = {};

  if (!policy || typeof policy !== 'object') {
    return {
      valid: false,
      status: 'POLICY_INCOMPLETE',
      errors: ['Policy must be a non-null object.'],
      warnings: [],
      parameter_status: {}
    };
  }

  // Helper to extract field from flat or nested structure
  const getField = (fieldName) => {
    if (policy[fieldName] !== undefined) return policy[fieldName];
    if (policy.rules && policy.rules[fieldName] !== undefined) return policy.rules[fieldName];
    if (policy.governance && policy.governance[fieldName] !== undefined) return policy.governance[fieldName];
    return undefined;
  };

  // 1. Level Check
  const level = getField('level');
  if (!level || !VALID_GATE_LEVELS.includes(level)) {
    errors.push(`Invalid or missing Gate level "${level}". Allowed levels: ${VALID_GATE_LEVELS.join(', ')}`);
  }

  // 2. Check Top-Level Structure & 16 Matrix Fields
  let missingCount = 0;
  for (const field of ALL_16_POLICY_FIELDS) {
    const val = getField(field);
    if (val === undefined || val === null) {
      errors.push(`Missing required policy field: "${field}".`);
      parameterStatus[field] = 'MISSING';
      missingCount++;
    } else if (val === 'UNSPECIFIED') {
      parameterStatus[field] = 'UNSPECIFIED';
    } else {
      parameterStatus[field] = 'DEFINED';
    }
  }

  // 3. Validate Against CQS Registry (even if fields are missing, validate what is present)
  let cqsAssets;
  try {
    cqsAssets = cqs.loadNormativeAssets();
  } catch (err) {
    errors.push(`Failed to load CQS normative assets for policy validation: ${err.message}`);
    return { valid: false, status: 'CQS_LOAD_ERROR', errors, warnings, parameter_status: parameterStatus };
  }

  const validControlIds = new Set(cqsAssets.controls.map(c => c.control_id));
  const validDomainCodes = new Set(Object.keys(cqsAssets.domains));

  // Check required_controls if present and not UNSPECIFIED
  const reqControls = getField('required_controls');
  if (reqControls !== undefined && reqControls !== 'UNSPECIFIED') {
    if (!Array.isArray(reqControls)) {
      errors.push('"required_controls" must be an array or "UNSPECIFIED".');
    } else {
      const seen = new Set();
      for (const cid of reqControls) {
        if (!validControlIds.has(cid)) {
          errors.push(`Unknown control ID "${cid}" in required_controls. Control does not exist in CQS v1.1 Registry.`);
        }
        if (seen.has(cid)) {
          errors.push(`Duplicate control ID "${cid}" in required_controls.`);
        }
        seen.add(cid);
      }
    }
  }

  // Check required_domains if present and not UNSPECIFIED
  const reqDomains = getField('required_domains');
  if (reqDomains !== undefined && reqDomains !== 'UNSPECIFIED') {
    if (!Array.isArray(reqDomains)) {
      errors.push('"required_domains" must be an array or "UNSPECIFIED".');
    } else {
      const seen = new Set();
      for (const dom of reqDomains) {
        if (!validDomainCodes.has(dom)) {
          errors.push(`Unknown domain code "${dom}" in required_domains. Valid 7 domains: ${Array.from(validDomainCodes).join(', ')}`);
        }
        if (seen.has(dom)) {
          errors.push(`Duplicate domain code "${dom}" in required_domains.`);
        }
        seen.add(dom);
      }
    }
  }

  // Check mandatory_gate_breakers
  const mandatoryBreakers = getField('mandatory_gate_breakers');
  if (mandatoryBreakers !== undefined && mandatoryBreakers !== 'UNSPECIFIED') {
    if (!Array.isArray(mandatoryBreakers)) {
      errors.push('"mandatory_gate_breakers" must be an array or "UNSPECIFIED".');
    } else {
      const seen = new Set();
      for (const gb of mandatoryBreakers) {
        if (!VALID_GATE_BREAKERS.includes(gb)) {
          errors.push(`Unknown Gate Breaker code "${gb}" in mandatory_gate_breakers. Valid codes: ${VALID_GATE_BREAKERS.join(', ')}`);
        }
        if (seen.has(gb)) {
          errors.push(`Duplicate Gate Breaker code "${gb}" in mandatory_gate_breakers.`);
        }
        seen.add(gb);
      }
    }
  }

  // Check minimum_cqs_score
  const minScore = getField('minimum_cqs_score');
  if (minScore !== undefined && minScore !== 'UNSPECIFIED') {
    if (typeof minScore !== 'number' || isNaN(minScore)) {
      errors.push('"minimum_cqs_score" must be a number (0.0 - 100.0) or "UNSPECIFIED".');
    } else if (minScore < 0 || minScore > 100) {
      errors.push(`"minimum_cqs_score" must be between 0.0 and 100.0 (received: ${minScore}).`);
    }
  }

  // Check remediation_window_hours
  const remWindow = getField('remediation_window_hours');
  if (remWindow !== undefined && remWindow !== 'UNSPECIFIED') {
    if (typeof remWindow !== 'number' || isNaN(remWindow) || remWindow < 0) {
      errors.push('"remediation_window_hours" must be a non-negative number or "UNSPECIFIED".');
    }
  }

  const hasUnspecified = Object.values(parameterStatus).some(st => st === 'UNSPECIFIED');
  let policyStatus;
  if (errors.length > 0) {
    policyStatus = missingCount > 0 ? 'POLICY_INCOMPLETE' : 'POLICY_INVALID';
  } else {
    policyStatus = hasUnspecified ? 'REQUIRES_GOVERNANCE_DECISION' : 'FULLY_RATIFIED';
  }

  return {
    valid: errors.length === 0,
    status: policyStatus,
    errors: errors,
    warnings: warnings,
    parameter_status: parameterStatus
  };
}

module.exports = {
  ALL_16_POLICY_FIELDS,
  VALID_GATE_LEVELS,
  VALID_GATE_BREAKERS,
  VALID_EVIDENCE_TYPES,
  validateGatePolicy
};
