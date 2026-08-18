/**
 * Castle Quality System (CQS) v1.1 — Mathematical Scoring Model
 * 
 * Principle: "La metodología es la autoridad; el software únicamente la ejecuta."
 * 
 * Strict deterministic mathematical engine implementing:
 * Level 1: Atomic Controls (c_i) -> Level 2: Subcriteria (Sub_j) -> 
 * Level 3: Official Domains (Dom_k) -> Level 4: Global CQS Score (CQS_raw)
 */

'use strict';

const STATUS_PASS = 'PASS';
const STATUS_FAIL = 'FAIL';
const STATUS_NA = 'N/A';
const STATUS_UNEXECUTED = 'UNEXECUTED';

const VALID_STATUSES = Object.freeze([
  STATUS_PASS,
  STATUS_FAIL,
  STATUS_NA,
  STATUS_UNEXECUTED
]);

/**
 * Evaluates an individual atomic control based on its normative status.
 * 
 * @param {Object} control Control definition from registry
 * @param {string} status 'PASS' | 'FAIL' | 'N/A' | 'UNEXECUTED'
 * @param {Object} [evidence] Associated evaluation evidence
 * @returns {Object} Evaluated control result
 */
function evaluateControl(control, status, evidence = null) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`[CQS Scoring] Invalid control status: "${status}" for control "${control.control_id}". Allowed: ${VALID_STATUSES.join(', ')}`);
  }

  let numericalScore = null;
  let isApplicable = false;
  let isExecuted = false;

  switch (status) {
    case STATUS_PASS:
      numericalScore = 1.0;
      isApplicable = true;
      isExecuted = true;
      break;
    case STATUS_FAIL:
      numericalScore = 0.0;
      isApplicable = true;
      isExecuted = true;
      break;
    case STATUS_NA:
      numericalScore = null;
      isApplicable = false;
      isExecuted = true;
      break;
    case STATUS_UNEXECUTED:
      numericalScore = null;
      isApplicable = false;
      isExecuted = false;
      break;
  }

  return {
    control_id: control.control_id,
    name: control.name,
    domain: control.domain,
    subcriterion: control.subcriterion,
    nominal_weight: control.inherited_weight,
    status: status,
    score: numericalScore,
    is_applicable: isApplicable,
    is_executed: isExecuted,
    origin_classification: control.origin_classification,
    evidence: evidence || null
  };
}

/**
 * Calculates subcriterion score aggregating child atomic controls.
 * Implements the Subcriterion Pruning Rule when all controls are N/A.
 * 
 * @param {Object} subcriterion Subcriterion definition
 * @param {Array<Object>} controlResults Evaluated results of child controls
 * @returns {Object} Subcriterion evaluation result
 */
function calculateSubcriterionScore(subcriterion, controlResults) {
  const nominalWeight = subcriterion.nominal_weight;
  
  let applicableWeight = 0.0;
  let excludedWeight = 0.0;
  let weightedScoreSum = 0.0;
  let executedCount = 0;
  let naCount = 0;
  let unexecutedCount = 0;

  for (const cr of controlResults) {
    if (cr.status === STATUS_UNEXECUTED) {
      unexecutedCount++;
      excludedWeight += cr.nominal_weight;
    } else if (cr.status === STATUS_NA) {
      naCount++;
      excludedWeight += cr.nominal_weight;
    } else if (cr.is_applicable) {
      executedCount++;
      applicableWeight += cr.nominal_weight;
      weightedScoreSum += cr.score * cr.nominal_weight;
    }
  }

  // Check pruning condition
  let status;
  let normalizedScore = null;

  if (controlResults.length === 0 || unexecutedCount === controlResults.length) {
    status = STATUS_UNEXECUTED;
  } else if (applicableWeight === 0.0 && naCount > 0) {
    // All executed controls are N/A -> Subcriterion is Pruned (N/A)
    status = STATUS_NA;
  } else if (applicableWeight > 0.0) {
    normalizedScore = weightedScoreSum / applicableWeight;
    status = normalizedScore >= 1.0 ? STATUS_PASS : (normalizedScore > 0 ? 'PARTIAL_AGGREGATE' : STATUS_FAIL);
  } else {
    status = STATUS_UNEXECUTED;
  }

  return {
    subcriterion_code: subcriterion.code,
    name: subcriterion.name,
    domain: subcriterion.domain,
    nominal_weight: nominalWeight,
    applicable_weight: applicableWeight,
    excluded_weight: excludedWeight,
    status: status,
    normalized_score: normalizedScore, // Range 0.0 to 1.0, or null
    controls_total: controlResults.length,
    controls_executed: executedCount,
    controls_na: naCount,
    controls_unexecuted: unexecutedCount,
    controls: controlResults
  };
}

/**
 * Calculates domain score aggregating child subcriteria.
 * 
 * @param {Object} domain Domain definition
 * @param {Array<Object>} subcriterionResults Evaluated results of child subcriteria
 * @returns {Object} Domain evaluation result
 */
function calculateDomainScore(domain, subcriterionResults) {
  const nominalWeight = domain.nominal_weight;
  
  let applicableWeight = 0.0;
  let excludedWeight = 0.0;
  let weightedScoreSum = 0.0;
  let activeCount = 0;
  let naCount = 0;
  let unexecutedCount = 0;

  for (const sr of subcriterionResults) {
    if (sr.status === STATUS_UNEXECUTED) {
      unexecutedCount++;
      excludedWeight += sr.nominal_weight;
    } else if (sr.status === STATUS_NA) {
      naCount++;
      excludedWeight += sr.nominal_weight;
    } else if (sr.normalized_score !== null) {
      activeCount++;
      applicableWeight += sr.nominal_weight;
      weightedScoreSum += sr.normalized_score * sr.nominal_weight;
    }
  }

  let status;
  let normalizedScore = null;

  if (subcriterionResults.length === 0 || unexecutedCount === subcriterionResults.length) {
    status = STATUS_UNEXECUTED;
  } else if (applicableWeight === 0.0 && naCount > 0) {
    status = STATUS_NA;
  } else if (applicableWeight > 0.0) {
    normalizedScore = weightedScoreSum / applicableWeight;
    status = normalizedScore >= 1.0 ? STATUS_PASS : (normalizedScore > 0 ? 'PARTIAL_AGGREGATE' : STATUS_FAIL);
  } else {
    status = STATUS_UNEXECUTED;
  }

  return {
    domain_code: domain.code,
    name: domain.name,
    nominal_weight: nominalWeight,
    applicable_weight: applicableWeight,
    excluded_weight: excludedWeight,
    status: status,
    normalized_score: normalizedScore, // Range 0.0 to 1.0, or null
    subcriteria_total: subcriterionResults.length,
    subcriteria_active: activeCount,
    subcriteria_na: naCount,
    subcriteria_unexecuted: unexecutedCount,
    subcriteria: subcriterionResults
  };
}

/**
 * Calculates Global CQS score across all 7 official domains.
 * Maintains full IEEE 754 double precision internally.
 * 
 * @param {Array<Object>} domainResults Evaluated results of all 7 domains
 * @returns {Object} Global score aggregation result
 */
function calculateGlobalScore(domainResults) {
  let totalNominalWeight = 0.0;
  let totalApplicableWeight = 0.0;
  let totalExcludedWeight = 0.0;
  let aggregateWeightedPoints = 0.0;
  let hasUnexecuted = false;

  // Compute atomic level excluded weights across all domains
  let totalAtomicNominalWeight = 0.0;
  let totalAtomicApplicableWeight = 0.0;
  let totalAtomicExcludedWeight = 0.0;

  for (const dr of domainResults) {
    totalNominalWeight += dr.nominal_weight;

    if (dr.status === STATUS_UNEXECUTED) {
      hasUnexecuted = true;
      totalExcludedWeight += dr.nominal_weight;
    } else if (dr.status === STATUS_NA) {
      totalExcludedWeight += dr.nominal_weight;
    } else if (dr.normalized_score !== null) {
      totalApplicableWeight += dr.nominal_weight;
      aggregateWeightedPoints += dr.normalized_score * dr.nominal_weight;
    }

    for (const sr of dr.subcriteria) {
      for (const cr of sr.controls) {
        totalAtomicNominalWeight += cr.nominal_weight;
        if (cr.status === STATUS_NA || cr.status === STATUS_UNEXECUTED) {
          totalAtomicExcludedWeight += cr.nominal_weight;
        } else if (cr.is_applicable) {
          totalAtomicApplicableWeight += cr.nominal_weight;
        }
      }
    }
  }

  let rawScore = null;
  let displayScore = null;

  if (totalApplicableWeight > 0.0) {
    // Normalization formula: (Sum(Score_dom * W_dom) / W_app_total) * 100.0
    rawScore = (aggregateWeightedPoints / totalApplicableWeight) * 100.0;
    // Display rounding to 2 decimal places strictly at presentation layer
    displayScore = Math.round((rawScore + Number.EPSILON) * 100) / 100;
  }

  return {
    cqs_raw_score: rawScore,
    cqs_display_score: displayScore,
    total_nominal_weight: totalNominalWeight,
    total_applicable_weight: totalApplicableWeight,
    total_excluded_weight: totalExcludedWeight,
    total_atomic_nominal_weight: totalAtomicNominalWeight,
    total_atomic_applicable_weight: totalAtomicApplicableWeight,
    total_atomic_excluded_weight: totalAtomicExcludedWeight,
    has_unexecuted_components: hasUnexecuted,
    domains: domainResults
  };
}

module.exports = {
  STATUS_PASS,
  STATUS_FAIL,
  STATUS_NA,
  STATUS_UNEXECUTED,
  VALID_STATUSES,
  evaluateControl,
  calculateSubcriterionScore,
  calculateDomainScore,
  calculateGlobalScore
};
