/**
 * Castle Quality System (CQS) v1.1 — Evidence Intake & Lab/Field Model
 * 
 * Principle: "La metodología es la autoridad; el software únicamente la ejecuta."
 * 
 * Strict enforcement of:
 * 1. Lab vs Field independence (PER-01.1 ≠ PER-01.2, PER-02.1 ≠ PER-02.2, PER-03.1 ≠ PER-03.2).
 * 2. Field without sufficient telemetry defaults to N/A, NEVER FAIL.
 * 3. Never substitute Field with Lab or extrapolate/interpolate.
 */

'use strict';

const { STATUS_PASS, STATUS_FAIL, STATUS_NA, STATUS_UNEXECUTED } = require('../scoring/scoring-model');

const FIELD_CONTROLS = Object.freeze([
  'PER-01.2', // LCP Field Telemetry
  'PER-02.2', // INP Field Telemetry
  'PER-03.2'  // CLS Field Telemetry
]);

const LAB_CONTROLS = Object.freeze([
  'PER-01.1', // LCP Lab Measurement
  'PER-02.1', // INP Lab Measurement
  'PER-03.1'  // CLS Lab Measurement
]);

const VALID_EVIDENCE_TYPES = Object.freeze([
  'automatic',
  'manual',
  'documentary',
  'runtime',
  'lab',
  'field',
  'UNSPECIFIED'
]);

/**
 * Validates and processes evidence for a specific control, enforcing normative rules.
 * 
 * @param {Object} control Control object from registry
 * @param {Object} rawEvidence Evidence payload provided by auditor/collector
 * @returns {Object} Processed result { status, evidence, notes }
 */
function processControlEvidence(control, rawEvidence) {
  const controlId = control.control_id;

  // Case 1: No evidence provided or explicitly UNEXECUTED
  if (!rawEvidence || rawEvidence.unexecuted === true) {
    // Check if it's a Field control that explicitly lacks telemetry
    if (FIELD_CONTROLS.includes(controlId) && (rawEvidence && rawEvidence.has_sufficient_telemetry === false)) {
      return {
        status: STATUS_NA,
        evidence: {
          type: 'field',
          has_sufficient_telemetry: false,
          reason: 'Insufficient RUM/CrUX real-user telemetry data.'
        },
        notes: 'Field metric evaluated as N/A due to absence of statistical telemetry.'
      };
    }

    return {
      status: STATUS_UNEXECUTED,
      evidence: null,
      notes: 'No evaluation evidence submitted.'
    };
  }

  // Case 2: Explicit N/A declaration
  if (rawEvidence.status === STATUS_NA || rawEvidence.not_applicable === true) {
    return {
      status: STATUS_NA,
      evidence: rawEvidence,
      notes: rawEvidence.na_reason || 'Control determined as Not Applicable.'
    };
  }

  // Case 3: Field telemetry specific evaluation
  if (FIELD_CONTROLS.includes(controlId)) {
    // If field telemetry is marked insufficient or missing
    if (rawEvidence.has_sufficient_telemetry === false || rawEvidence.sample_count === 0 || rawEvidence.telemetry_available === false) {
      return {
        status: STATUS_NA,
        evidence: rawEvidence,
        notes: 'Field metric evaluated as N/A (Rule: Field without telemetry = N/A, never FAIL).'
      };
    }

    // Must never accept Lab data passed into Field control
    if (rawEvidence.is_simulated === true || rawEvidence.is_lab === true) {
      throw new Error(`[CQS Evidence] Methodological Violation: Cannot substitute Lab simulation data into Field control "${controlId}". Lab and Field are strictly independent.`);
    }
  }

  // Case 4: Lab measurement specific evaluation
  if (LAB_CONTROLS.includes(controlId)) {
    if (rawEvidence.is_field_telemetry === true) {
      throw new Error(`[CQS Evidence] Methodological Violation: Cannot substitute Field telemetry data into Lab control "${controlId}". Lab and Field are strictly independent.`);
    }
  }

  // Case 5: Direct Status or Value Evaluation
  const status = rawEvidence.status;
  if (!status || ![STATUS_PASS, STATUS_FAIL, STATUS_NA, STATUS_UNEXECUTED].includes(status)) {
    throw new Error(`[CQS Evidence] Invalid status "${status}" in evidence for control "${controlId}".`);
  }

  return {
    status: status,
    evidence: rawEvidence,
    notes: rawEvidence.notes || `Evaluated with status ${status}.`
  };
}

module.exports = {
  FIELD_CONTROLS,
  LAB_CONTROLS,
  VALID_EVIDENCE_TYPES,
  processControlEvidence
};
