/**
 * Castle Quality System (CQS) v1.1 — Integrity Validator
 * 
 * Principle: "La metodología es la autoridad; el software únicamente la ejecuta."
 * 
 * Verifies that the specification, control registry, scoring model, and evidence
 * preserve 100% fidelity with the frozen CQS v1.1 invariants before execution.
 */

'use strict';

const path = require('path');
const fs = require('fs');

/**
 * Validates the CQS registry and governance invariants.
 * 
 * @param {Object} [customRegistry] Optional custom registry for testing rejection
 * @returns {Object} Deterministic integrity validation report
 */
function validateCqsIntegrity(customRegistry = null) {
  const baseDir = path.resolve(__dirname, '..');
  
  let controls;
  let domainData;
  let invariantsData;

  try {
    controls = customRegistry ? customRegistry.controls : JSON.parse(fs.readFileSync(path.join(baseDir, 'registry', 'controls.json'), 'utf8'));
    domainData = customRegistry ? customRegistry.domains : JSON.parse(fs.readFileSync(path.join(baseDir, 'registry', 'domains.json'), 'utf8'));
    invariantsData = customRegistry ? customRegistry.invariants : JSON.parse(fs.readFileSync(path.join(baseDir, 'governance', 'invariants.json'), 'utf8'));
  } catch (err) {
    return {
      integrity: 'FAIL',
      error: `Failed to load registry files: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }

  const domains = domainData.domains;
  const subcriteria = domainData.subcriteria;
  const errors = [];
  const warnings = [];

  // 1. Control Count Check
  const expectedControlCount = 65;
  if (controls.length !== expectedControlCount) {
    errors.push(`Invalid control count: Expected ${expectedControlCount}, got ${controls.length}`);
  }

  // 2. Domain Count & Definition Check
  const expectedDomains = ['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL', 'MNT'];
  const expectedDomainWeights = {
    PER: 20.0,
    SEC: 20.0,
    ACC: 15.0,
    SEO: 15.0,
    UX: 15.0,
    REL: 10.0,
    MNT: 5.0
  };

  const domainCodes = Object.keys(domains);
  if (domainCodes.length !== expectedDomains.length) {
    errors.push(`Invalid domain count: Expected ${expectedDomains.length}, got ${domainCodes.length}`);
  }

  for (const d of expectedDomains) {
    if (!domains[d]) {
      errors.push(`Missing official domain: "${d}"`);
    } else if (Math.abs(domains[d].nominal_weight - expectedDomainWeights[d]) > 1e-6) {
      errors.push(`Altered domain weight for "${d}": Expected ${expectedDomainWeights[d]}, got ${domains[d].nominal_weight}`);
    }
  }

  // 3. Domain Nominal Weights Sum Check
  const totalDomainWeight = Object.values(domains).reduce((sum, d) => sum + d.nominal_weight, 0);
  if (Math.abs(totalDomainWeight - 100.0) > 1e-6) {
    errors.push(`Invalid domain weight sum: Expected 100.00, got ${totalDomainWeight.toFixed(4)}`);
  }

  // 4. Subcriteria Sum and Parent Mapping Check
  const subcriteriaCodes = Object.keys(subcriteria);
  
  for (const [subCode, sub] of Object.entries(subcriteria)) {
    if (!domains[sub.domain]) {
      errors.push(`Orphan subcriterion "${subCode}": Parent domain "${sub.domain}" does not exist.`);
    }
  }

  for (const [domCode, dom] of Object.entries(domains)) {
    const childSubs = dom.subcriteria.map(sc => subcriteria[sc]).filter(Boolean);
    const subSum = childSubs.reduce((sum, sc) => sum + sc.nominal_weight, 0);
    if (Math.abs(subSum - dom.nominal_weight) > 1e-6) {
      errors.push(`Subcriteria sum mismatch in domain "${domCode}": Domain weight = ${dom.nominal_weight}, Subcriteria sum = ${subSum.toFixed(4)}`);
    }
  }

  // 5. Control IDs, Duplicates, and Parent References Check
  const seenControlIds = new Set();
  const duplicateIds = [];
  let totalControlWeight = 0.0;
  let explicitCount = 0;
  let derivedCount = 0;
  let newProposalCount = 0;

  for (const ctrl of controls) {
    if (seenControlIds.has(ctrl.control_id)) {
      duplicateIds.push(ctrl.control_id);
    }
    seenControlIds.add(ctrl.control_id);
    totalControlWeight += ctrl.inherited_weight;

    // Check parent reference
    if (!subcriteria[ctrl.subcriterion]) {
      errors.push(`Orphan control "${ctrl.control_id}": Parent subcriterion "${ctrl.subcriterion}" does not exist.`);
    }

    // Check origin classification
    if (ctrl.origin_classification === 'EXPLICITLY_APPROVED') {
      explicitCount++;
    } else if (ctrl.origin_classification === 'DERIVED_FROM_APPROVED_CRITERION') {
      derivedCount++;
    } else if (ctrl.origin_classification === 'NEW_PROPOSAL') {
      newProposalCount++;
      errors.push(`Disallowed NEW_PROPOSAL detected in control "${ctrl.control_id}". Rule: NEW_PROPOSAL = 0.`);
    } else {
      errors.push(`Invalid origin classification "${ctrl.origin_classification}" in control "${ctrl.control_id}".`);
    }
  }

  if (duplicateIds.length > 0) {
    errors.push(`Duplicate control IDs detected: ${duplicateIds.join(', ')}`);
  }

  if (Math.abs(totalControlWeight - 100.0) > 1e-6) {
    errors.push(`Invalid control weight sum: Expected 100.00, got ${totalControlWeight.toFixed(4)}`);
  }

  // 6. Subcriteria Atomic Controls Sum Check
  for (const [subCode, sub] of Object.entries(subcriteria)) {
    const childCtrls = controls.filter(c => c.subcriterion === subCode);
    const ctrlSum = childCtrls.reduce((sum, c) => sum + c.inherited_weight, 0);
    if (Math.abs(ctrlSum - sub.nominal_weight) > 1e-6) {
      errors.push(`Atomic controls sum mismatch in subcriterion "${subCode}": Subcriterion weight = ${sub.nominal_weight}, Controls sum = ${ctrlSum.toFixed(4)}`);
    }
  }

  // 7. Check Invariant Counts
  const expectedExplicit = 24;
  const expectedDerived = 41;

  if (explicitCount !== expectedExplicit) {
    errors.push(`EXPLICITLY_APPROVED count mismatch: Expected ${expectedExplicit}, got ${explicitCount}`);
  }

  if (derivedCount !== expectedDerived) {
    errors.push(`DERIVED_FROM_APPROVED_CRITERION count mismatch: Expected ${expectedDerived}, got ${derivedCount}`);
  }

  if (newProposalCount !== 0) {
    errors.push(`NEW_PROPOSAL count mismatch: Expected 0, got ${newProposalCount}`);
  }

  const isPass = errors.length === 0;

  return {
    integrity: isPass ? 'PASS' : 'FAIL',
    specification_version: invariantsData ? invariantsData.specification_version : '1.1.0-candidate',
    status: isPass ? 'VALIDATED' : 'INVALID',
    metrics: {
      total_controls: controls.length,
      total_subcriteria: Object.keys(subcriteria).length,
      total_domains: Object.keys(domains).length,
      explicitly_approved: explicitCount,
      derived_from_approved_criterion: derivedCount,
      new_proposal: newProposalCount,
      nominal_weight_total: totalControlWeight,
      test_04_status: 'Pending / UNEXECUTED',
      partial_decision_status: 'OPEN_METHODOLOGICAL_DECISION'
    },
    errors: errors,
    warnings: warnings,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validates input evaluation evidence payload against registry.
 * Rejects unknown controls or invalid weights.
 * 
 * @param {Object} evidencePayload 
 * @param {Array<Object>} controlsRegistry 
 * @returns {{ valid: boolean, errors: Array<string> }}
 */
function validateEvidencePayload(evidencePayload, controlsRegistry) {
  const errors = [];
  const validControlIds = new Set(controlsRegistry.map(c => c.control_id));

  if (!evidencePayload || typeof evidencePayload !== 'object') {
    return { valid: false, errors: ['Evidence payload must be a non-null object.'] };
  }

  const submittedControls = evidencePayload.controls || {};

  for (const [cid, ev] of Object.entries(submittedControls)) {
    if (!validControlIds.has(cid)) {
      errors.push(`Unknown control ID in evidence payload: "${cid}". Control does not exist in CQS v1.1 Registry.`);
    }

    if (ev && ev.nominal_weight !== undefined) {
      const regCtrl = controlsRegistry.find(c => c.control_id === cid);
      if (regCtrl && Math.abs(ev.nominal_weight - regCtrl.inherited_weight) > 1e-6) {
        errors.push(`Altered nominal weight in evidence for "${cid}": Registry weight = ${regCtrl.inherited_weight}, submitted = ${ev.nominal_weight}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  validateCqsIntegrity,
  validateEvidencePayload
};
