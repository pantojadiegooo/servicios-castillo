/**
 * Castle Security & Quality Gate — Decision Engine (Phase 3 Matrix Support)
 * 
 * Principle: "CQS = WHAT IS MEASURED, CQS ENGINE = HOW IT IS COMPUTED, 
 *             CASTLE GATE = HOW THE RESULT IS USED TO CONTROL DELIVERY"
 * 
 * Consumes CQS evaluation results and applies Gate Level policies (C1 to C6)
 * to issue deterministic delivery and release decisions.
 */

'use strict';

const {
  GATE_STATE_NOT_STARTED,
  GATE_STATE_IN_PROGRESS,
  GATE_STATE_EVIDENCE_PENDING,
  GATE_STATE_EVALUATION_PENDING,
  GATE_STATE_BLOCKED,
  GATE_STATE_CONDITIONAL,
  GATE_STATE_PASSED,
  GATE_STATE_REQUIRES_REMEDIATION,
  GATE_STATE_VERIFICATION_PENDING,
  GATE_STATE_CLOSED
} = require('./gate-states');

const { resolveGatePolicy } = require('../policy/policy-resolver');

const GATE_VERSION = '1.0.0-candidate';

/**
 * Evaluates delivery release readiness for a target system.
 * 
 * @param {Object} params {
 *   cqs_evaluation_result: Object,
 *   gate_level: string ('C1'..'C6'),
 *   policy_override?: Object,
 *   evidence_package?: Object
 * }
 * @returns {Object} Deterministic Gate Decision
 */
function evaluateGateDecision(params) {
  const { cqs_evaluation_result, gate_level, policy_override, evidence_package } = params;

  if (!cqs_evaluation_result) {
    throw new Error('[Gate Decision Engine] Missing CQS Evaluation Result. Gate must consume CQS Engine output.');
  }

  const policy = resolveGatePolicy(gate_level, policy_override);
  const rules = policy.rules;

  const timestamp = new Date().toISOString();
  const decisionId = `GATE-DEC-${gate_level}-${Date.now()}`;

  const blockers = [];
  const requiredActions = [];
  let gateState;
  let decisionRationale = [];

  // Step 1: Gate Breakers Evaluation (Mandatory Binary Vetoes)
  const cqsBreakers = cqs_evaluation_result.gate_breakers || { status: 'CLEARED', evaluated_gates: [] };
  const triggeredBreakers = cqsBreakers.evaluated_gates.filter(g => g.triggered);

  if (cqsBreakers.status === 'BLOCKED' || triggeredBreakers.length > 0) {
    gateState = GATE_STATE_BLOCKED;
    for (const tb of triggeredBreakers) {
      blockers.push({
        type: 'GATE_BREAKER',
        code: tb.code,
        name: tb.name,
        details: tb.details,
        severity: 'CRITICAL_RELEASE_VETO'
      });
      requiredActions.push(`Remediate triggered Gate Breaker: [${tb.code}] ${tb.name}`);
    }
    decisionRationale.push(`Release blocked by ${triggeredBreakers.length} active Gate Breaker(s). Mandatory veto enforced.`);
  }

  // Step 2: Unexecuted Controls & Incomplete Evaluation Check
  const hasUnexecuted = cqs_evaluation_result.summary.has_unexecuted_components;
  if (hasUnexecuted && rules.allow_unexecuted_controls === false) {
    if (gateState !== GATE_STATE_BLOCKED) {
      gateState = GATE_STATE_EVIDENCE_PENDING;
    }
    blockers.push({
      type: 'INCOMPLETE_EVALUATION',
      details: 'Evaluation cycle contains unexecuted controls not permitted by Gate policy.',
      severity: 'HIGH'
    });
    requiredActions.push('Submit complete evaluation evidence for all pending unexecuted controls.');
    decisionRationale.push('Policy does not allow unexecuted controls for release clearance.');
  }

  // Step 2.5: Mandatory Required Controls Check
  if (Array.isArray(rules.required_controls) && rules.required_controls.length > 0) {
    const allEvaluatedControls = {};
    if (Array.isArray(cqs_evaluation_result.domains)) {
      for (const d of cqs_evaluation_result.domains) {
        if (Array.isArray(d.subcriteria)) {
          for (const s of d.subcriteria) {
            if (Array.isArray(s.controls)) {
              for (const c of s.controls) {
                allEvaluatedControls[c.control_id] = c;
              }
            }
          }
        }
      }
    }

    const failingRequired = [];
    for (const reqId of rules.required_controls) {
      const ctrl = allEvaluatedControls[reqId];
      if (ctrl && ctrl.status === 'FAIL') {
        failingRequired.push(reqId);
      }
    }

    if (failingRequired.length > 0) {
      gateState = GATE_STATE_BLOCKED;
      for (const frc of failingRequired) {
        blockers.push({
          type: 'REQUIRED_CONTROL_FAILED',
          code: frc,
          name: `Required Control ${frc} Failed`,
          details: `Policy level ${gate_level} strictly requires control ${frc} to pass or have an active authorized waiver.`,
          severity: 'CRITICAL_RELEASE_BLOCKER'
        });
        requiredActions.push(`Remediate or obtain authorized waiver for mandatory control: ${frc}`);
      }
      decisionRationale.push(`${failingRequired.length} mandatory required control(s) failed evaluation: ${failingRequired.join(', ')}.`);
    }
  }

  // Step 3: Minimum CQS Score Rule Evaluation
  const cqsRawScore = cqs_evaluation_result.summary.cqs_raw_score;
  const minScoreRule = rules.minimum_cqs_score;

  if (gateState !== GATE_STATE_BLOCKED && gateState !== GATE_STATE_EVIDENCE_PENDING) {
    if (minScoreRule !== 'UNSPECIFIED' && typeof minScoreRule === 'number') {
      if (cqsRawScore === null || cqsRawScore < minScoreRule) {
        gateState = GATE_STATE_REQUIRES_REMEDIATION;
        blockers.push({
          type: 'SCORE_DEFICIT',
          details: `CQS score (${cqsRawScore !== null ? cqsRawScore.toFixed(2) : 'N/A'}) is below policy minimum threshold (${minScoreRule}).`,
          severity: 'HIGH'
        });
        requiredActions.push(`Improve engineering quality to achieve minimum CQS threshold of ${minScoreRule}.`);
        decisionRationale.push(`CQS score fails policy threshold requirement of ${minScoreRule}.`);
      }
    } else {
      // Threshold is UNSPECIFIED: Gate strictly consumes CQS final_verdict
      const cqsVerdict = cqs_evaluation_result.summary.final_verdict;
      if (cqsVerdict === 'PASS_RELEASE') {
        gateState = GATE_STATE_PASSED;
        decisionRationale.push('CQS evaluation certified PASS_RELEASE with zero Gate Breakers.');
      } else if (cqsVerdict === 'CONDITIONAL_APPROVAL') {
        gateState = GATE_STATE_CONDITIONAL;
        decisionRationale.push('CQS evaluation certified CONDITIONAL_APPROVAL.');
        requiredActions.push('Obtain formal engineering sign-off for conditional items.');
      } else if (cqsVerdict === 'CYCLE_INCOMPLETE_UNEXECUTED') {
        gateState = GATE_STATE_EVIDENCE_PENDING;
        decisionRationale.push('CQS evaluation incomplete: contains UNEXECUTED controls.');
        requiredActions.push('Provide evaluation evidence for unexecuted controls.');
      } else {
        gateState = GATE_STATE_REQUIRES_REMEDIATION;
        decisionRationale.push(`CQS verdict is "${cqsVerdict}". Remediation required.`);
        requiredActions.push('Remediate failing controls identified in CQS report.');
      }
    }
  }

  // If gate passed successfully with no blockers
  if (!gateState) {
    gateState = GATE_STATE_PASSED;
    decisionRationale.push('All gate policies and CQS quality requirements successfully satisfied.');
  }

  return {
    decision_id: decisionId,
    timestamp: timestamp,
    gate_level: gate_level,
    gate_level_name: policy.name,
    gate_state: gateState,
    versioning: {
      cqs_specification_version: cqs_evaluation_result.specification_version,
      cqs_engine_version: '1.1.0-candidate',
      gate_version: GATE_VERSION,
      gate_policy_version: policy.policy_version,
      evaluation_id: cqs_evaluation_result.evaluation_id,
      evidence_package_id: evidence_package ? evidence_package.package_id : 'UNSPECIFIED'
    },
    cqs_summary: {
      raw_score: cqsRawScore,
      display_score: cqs_evaluation_result.summary.cqs_display_score,
      verdict: cqs_evaluation_result.summary.final_verdict,
      applicable_weight: cqs_evaluation_result.summary.total_applicable_weight,
      excluded_weight: cqs_evaluation_result.summary.total_excluded_weight
    },
    policy_applied: {
      level: policy.level,
      name: policy.name,
      rules: policy.rules,
      governance_status: policy.governance_status || (policy.governance ? policy.governance.status : 'UNSPECIFIED')
    },
    blockers: blockers,
    required_actions: requiredActions,
    decision_rationale: decisionRationale.join(' '),
    traceability_chain: {
      evidence_package_id: evidence_package ? evidence_package.package_id : 'UNSPECIFIED',
      evaluation_id: cqs_evaluation_result.evaluation_id,
      domains_evaluated: cqs_evaluation_result.domains.map(d => ({
        code: d.domain_code,
        score: d.normalized_score,
        status: d.status
      })),
      gate_decision_id: decisionId
    }
  };
}

module.exports = {
  GATE_VERSION,
  evaluateGateDecision
};
