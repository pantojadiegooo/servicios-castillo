/**
 * Castle Security & Quality Gate — Policy Resolver (Phase 3 Matrix Support)
 * 
 * Resolves Gate Level (C1 to C6) to its corresponding Gate Policy.
 * Supports default template resolution or custom policy configuration overrides.
 * Enforces policy validation against CQS normative assets without template mutation.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { validateGatePolicy, VALID_GATE_LEVELS } = require('./policy-validator');

/**
 * Loads default policies and level taxonomy from disk without mutating them.
 * 
 * @returns {Object} { levels, defaultPolicies }
 */
function loadPolicyAssets() {
  const levelsPath = path.join(__dirname, 'gate-levels.json');
  const policiesPath = path.join(__dirname, 'default-policies.json');

  const levels = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));
  const defaultPolicies = JSON.parse(fs.readFileSync(policiesPath, 'utf8'));

  return {
    levels: levels.levels,
    defaultPolicies: defaultPolicies.policies
  };
}

/**
 * Resolves a Gate Policy for a target level.
 * 
 * @param {string} level 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6'
 * @param {Object} [customPolicyOverride] Optional policy override object
 * @returns {Object} Resolved and validated Gate Policy
 */
function resolveGatePolicy(level, customPolicyOverride = null) {
  if (!VALID_GATE_LEVELS.includes(level)) {
    throw new Error(`[Gate Policy Resolver] Invalid Gate Level: "${level}". Allowed levels: ${VALID_GATE_LEVELS.join(', ')}`);
  }

  const { levels, defaultPolicies } = loadPolicyAssets();
  const defaultPolicy = JSON.parse(JSON.stringify(defaultPolicies[level])); // Deep copy to prevent template mutation

  if (!defaultPolicy) {
    throw new Error(`[Gate Policy Resolver] No default policy template registered for level: "${level}".`);
  }

  let resolvedPolicy;

  if (customPolicyOverride) {
    const overrideRules = customPolicyOverride.rules || customPolicyOverride;
    resolvedPolicy = {
      ...defaultPolicy,
      ...customPolicyOverride,
      policy_version: customPolicyOverride.policy_version || `${defaultPolicy.policy_version}-custom`,
      governance_status: customPolicyOverride.governance_status || 'CUSTOM_OVERRIDE_POLICY',
      decision_reference: customPolicyOverride.decision_reference || 'CUSTOM_CONFIGURED',
      _override_metadata: {
        applied_at: new Date().toISOString(),
        provenance: customPolicyOverride.provenance || 'PROJECT_OVERRIDE'
      }
    };

    // Apply rule overrides if passed
    for (const key of Object.keys(overrideRules)) {
      if (key !== 'rules' && key !== 'governance') {
        resolvedPolicy[key] = overrideRules[key];
      }
    }
  } else {
    resolvedPolicy = defaultPolicy;
  }

  // Populate rules sub-object for backward compatibility
  resolvedPolicy.rules = {
    required_controls: resolvedPolicy.required_controls,
    required_domains: resolvedPolicy.required_domains,
    required_evidence_types: resolvedPolicy.required_evidence_types,
    minimum_cqs_score: resolvedPolicy.minimum_cqs_score,
    mandatory_gate_breakers: resolvedPolicy.mandatory_gate_breakers,
    allow_unexecuted_controls: resolvedPolicy.allow_unexecuted_controls,
    allow_conditional_approval: resolvedPolicy.allow_conditional_approval,
    approval_roles_required: resolvedPolicy.approval_roles_required,
    remediation_window_hours: resolvedPolicy.remediation_window_hours,
    post_verification_required: resolvedPolicy.post_verification_required
  };

  resolvedPolicy.governance = {
    status: resolvedPolicy.governance_status,
    decision_reference: resolvedPolicy.decision_reference
  };

  // Validate resolved policy against CQS normative assets
  const validation = validateGatePolicy(resolvedPolicy);
  if (!validation.valid) {
    throw new Error(`[Gate Policy Resolver] Policy validation failed for level "${level}": ${validation.errors.join('; ')}`);
  }

  resolvedPolicy._validation = validation;

  // Compute RFC 8785 canonical hash of the policy artifact
  const crypto = require('crypto');
  const { canonicalize } = require('../crypto/canonicalizer');
  const canonicalString = canonicalize(resolvedPolicy);
  const policyHash = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');

  resolvedPolicy.integrity = {
    canonical_algorithm: 'RFC-8785-JCS',
    policy_sha256: policyHash
  };

  return resolvedPolicy;
}

module.exports = {
  VALID_GATE_LEVELS,
  loadPolicyAssets,
  resolveGatePolicy,
  validateGatePolicy
};

