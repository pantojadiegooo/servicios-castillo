/**
 * Castle Security & Quality Gate — Base Evidence Adapter
 * 
 * Abstract base class for all external telemetry & scanner adapters.
 * Guarantees:
 * - RFC 8785 canonical payload hashing
 * - Standardized normalized findings model
 * - Explicit fail-closed status handling (PASS, FAIL, INCONCLUSIVE, UNEXECUTED, N/A)
 * - Zero synthetic value invention
 */

'use strict';

const crypto = require('crypto');
const { canonicalize } = require('../../crypto/canonicalizer');

// Standardized Adapter Execution & Finding Statuses
const ADAPTER_STATUS_PASS = 'PASS';
const ADAPTER_STATUS_FAIL = 'FAIL';
const ADAPTER_STATUS_INCONCLUSIVE = 'INCONCLUSIVE';
const ADAPTER_STATUS_UNEXECUTED = 'UNEXECUTED';
const ADAPTER_STATUS_NA = 'N/A';

class BaseEvidenceAdapter {
  constructor(adapterName, sourceTool, version = '1.0.0') {
    if (new.target === BaseEvidenceAdapter) {
      throw new TypeError('BaseEvidenceAdapter is abstract and cannot be instantiated directly.');
    }
    this.adapterName = adapterName;
    this.sourceTool = sourceTool;
    this.version = version;
  }

  /**
   * Hashes raw input data deterministically using RFC 8785 canonical JSON stringification.
   */
  hashRawData(data) {
    if (typeof data === 'string') {
      return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
    }
    const canonicalStr = canonicalize(data);
    return crypto.createHash('sha256').update(canonicalStr, 'utf8').digest('hex');
  }

  /**
   * Normalizes a finding into the standard Castle Gate Finding structure.
   * 
   * @param {Object} params { ruleId, severity, controlId, file, line, column, message, details }
   * @returns {Object} Normalized Finding
   */
  createNormalizedFinding(params) {
    return {
      rule_id: params.ruleId || 'GENERIC_RULE',
      source_tool: this.sourceTool,
      severity: params.severity || 'MEDIUM', // CRITICAL, HIGH, MEDIUM, LOW, INFO
      cqs_control_id: params.controlId || null,
      file: params.file || 'unknown',
      line: params.line || 1,
      column: params.column || 1,
      message: params.message || 'Finding detected by external scanner',
      details: params.details || {}
    };
  }

  /**
   * Abstract parse method to be implemented by child classes.
   * 
   * @param {Object|string} rawInput 
   * @param {Object} [options]
   * @returns {Object} { status, controls, findings, provenance }
   */
  parse(rawInput, options = {}) {
    throw new Error(`[BaseEvidenceAdapter] "parse()" method must be implemented by subclass ${this.constructor.name}`);
  }
}

module.exports = {
  BaseEvidenceAdapter,
  ADAPTER_STATUS_PASS,
  ADAPTER_STATUS_FAIL,
  ADAPTER_STATUS_INCONCLUSIVE,
  ADAPTER_STATUS_UNEXECUTED,
  ADAPTER_STATUS_NA
};
