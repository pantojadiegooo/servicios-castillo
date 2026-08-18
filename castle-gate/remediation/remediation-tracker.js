/**
 * Castle Security & Quality Gate — Remediation Tracker
 * 
 * Manages the remediation lifecycle:
 * Evaluation -> Blocker / Failure -> Remediation -> Re-evaluation -> Verification -> Decision
 * Preserves append-only immutable historical records across all cycles.
 */

'use strict';

class RemediationSession {
  constructor(sessionId, targetSystem, gateLevel) {
    this.session_id = sessionId || `REM-SESS-${Date.now()}`;
    this.target_system = targetSystem;
    this.gate_level = gateLevel;
    this.created_at = new Date().toISOString();
    this.cycles = [];
    this.is_closed = false;
  }

  /**
   * Records an evaluation cycle within the remediation session.
   * 
   * @param {Object} cycleData {
   *   cycle_number?: number,
   *   cqs_evaluation_result: Object,
   *   gate_decision: Object,
   *   remediation_notes?: string,
   *   resolved_blockers?: Array<string>
   * }
   */
  recordCycle(cycleData) {
    if (this.is_closed) {
      throw new Error(`[Remediation Tracker] Cannot add cycles to a closed session: ${this.session_id}`);
    }

    const cycleNumber = this.cycles.length + 1;
    const cycleRecord = {
      cycle_number: cycleNumber,
      recorded_at: new Date().toISOString(),
      evaluation_id: cycleData.cqs_evaluation_result.evaluation_id,
      cqs_score: cycleData.cqs_evaluation_result.summary.cqs_display_score,
      gate_state: cycleData.gate_decision.gate_state,
      blockers: cycleData.gate_decision.blockers,
      remediation_notes: cycleData.remediation_notes || 'Initial or subsequent remediation cycle.',
      resolved_blockers: cycleData.resolved_blockers || [],
      decision_snapshot: cycleData.gate_decision
    };

    this.cycles.push(cycleRecord);

    if (cycleData.gate_decision.gate_state === 'PASSED' || cycleData.gate_decision.gate_state === 'CONDITIONAL') {
      this.is_closed = true;
    }

    return cycleRecord;
  }

  /**
   * Returns complete history of remediation cycles using defensive deep cloning
   * to guarantee in-memory immutability of the internal session state.
   */
  getHistory() {
    return {
      session_id: this.session_id,
      target_system: this.target_system ? JSON.parse(JSON.stringify(this.target_system)) : null,
      gate_level: this.gate_level,
      created_at: this.created_at,
      total_cycles: this.cycles.length,
      is_closed: this.is_closed,
      cycles: JSON.parse(JSON.stringify(this.cycles))
    };
  }
}

/**
 * Factory to create a new remediation session.
 */
function createRemediationSession(sessionId, targetSystem, gateLevel) {
  return new RemediationSession(sessionId, targetSystem, gateLevel);
}

module.exports = {
  RemediationSession,
  createRemediationSession
};
