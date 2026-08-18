/**
 * Castle Security & Quality Gate — axe-core Accessibility Adapter
 * 
 * Ingests official Deque axe-core JSON automated accessibility audit results.
 * Distinguishes real automated WCAG evaluations from surface markup heuristics.
 * Maps violations to CQS ACC-01 .. ACC-04 and Gate Breaker GB-05.
 */

'use strict';

const {
  BaseEvidenceAdapter,
  ADAPTER_STATUS_PASS,
  ADAPTER_STATUS_FAIL
} = require('./base-adapter');

class AxeAdapter extends BaseEvidenceAdapter {
  constructor() {
    super('AxeAdapter', 'axe-core', '4.8.0');
  }

  /**
   * Ingests axe-core JSON audit report.
   * 
   * @param {Object|string} axeInput 
   * @param {Object} [options]
   * @returns {Object}
   */
  parse(axeInput, options = {}) {
    let rawData = axeInput;
    if (typeof axeInput === 'string') {
      try {
        rawData = JSON.parse(axeInput);
      } catch (err) {
        return {
          adapter_status: ADAPTER_STATUS_FAIL,
          source_tool: this.sourceTool,
          controls: {
            'ACC-01.1': { status: 'UNEXECUTED', details: `axe-core output unparseable: ${err.message}`, findings: [] }
          },
          gate_evidence: {},
          findings: [],
          error: err.message
        };
      }
    }

    const rawHash = this.hashRawData(rawData);
    const violations = (rawData && Array.isArray(rawData.violations)) ? rawData.violations : [];
    const passes = (rawData && Array.isArray(rawData.passes)) ? rawData.passes : [];
    const findings = [];
    let criticalImpactCount = 0;

    const controlMappings = {
      'ACC-01.1': { passed: true, violations: [] }, // Landmarks & semantic hierarchy
      'ACC-01.2': { passed: true, violations: [] }, // Headings
      'ACC-02.1': { passed: true, violations: [] }, // Focus & keyboard
      'ACC-03.1': { passed: true, violations: [] }, // Color contrast
      'ACC-04.1': { passed: true, violations: [] }  // ARIA & attributes
    };

    for (const v of violations) {
      const impact = (v.impact || 'moderate').toUpperCase();
      if (impact === 'CRITICAL') criticalImpactCount++;

      let targetControl = 'ACC-01.1';
      const ruleId = v.id || '';

      if (ruleId.includes('contrast') || ruleId.includes('color') || ruleId.includes('image') || ruleId.includes('alt')) {
        targetControl = 'ACC-03.1';
      } else if (ruleId.includes('heading') || ruleId.includes('page-has-heading-one')) {
        targetControl = 'ACC-01.2';
      } else if (ruleId.includes('focus') || ruleId.includes('tabindex') || ruleId.includes('keyboard')) {
        targetControl = 'ACC-02.1';
      } else if (ruleId.includes('aria') || ruleId.includes('role')) {
        targetControl = 'ACC-04.1';
      } else if (ruleId.includes('landmark') || ruleId.includes('region') || ruleId.includes('bypass')) {
        targetControl = 'ACC-01.1';
      }

      controlMappings[targetControl].passed = false;
      controlMappings[targetControl].violations.push(v);

      const affectedNodes = Array.isArray(v.nodes) ? v.nodes.map(n => n.html || (n.target ? n.target.join(' ') : 'node')).slice(0, 5) : [];

      findings.push(this.createNormalizedFinding({
        ruleId: v.id,
        severity: impact === 'CRITICAL' ? 'CRITICAL' : (impact === 'SERIOUS' ? 'HIGH' : 'MEDIUM'),
        controlId: targetControl,
        file: 'DOM-Runtime',
        line: 1,
        column: 1,
        message: `[WCAG ${v.tags ? v.tags.filter(t => t.startsWith('wcag')).join(', ') : 'AA'}] ${v.help || v.description}`,
        details: {
          impact: v.impact,
          tags: v.tags,
          helpUrl: v.helpUrl,
          affectedNodes: affectedNodes
        }
      }));
    }

    const controls = {};
    const gate_evidence = {};

    for (const [ctrlId, mapInfo] of Object.entries(controlMappings)) {
      if (mapInfo.passed) {
        controls[ctrlId] = {
          status: 'PASS',
          details: `axe-core verified zero WCAG violations for control ${ctrlId}.`,
          findings: []
        };
      } else {
        controls[ctrlId] = {
          status: 'FAIL',
          details: `${mapInfo.violations.length} automated accessibility violation(s) detected.`,
          findings: mapInfo.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help }))
        };
      }
    }

    // Gate Breaker GB-05: Critical Accessibility Blocker
    if (criticalImpactCount > 0) {
      gate_evidence['GB-05'] = true;
      gate_evidence['GB-05_details'] = `Gate Breaker Triggered: ${criticalImpactCount} critical accessibility blocker(s) detected by axe-core.`;
    }

    return {
      adapter_status: findings.length === 0 ? ADAPTER_STATUS_PASS : ADAPTER_STATUS_FAIL,
      source_tool: this.sourceTool,
      raw_payload_sha256: rawHash,
      controls: controls,
      gate_evidence: gate_evidence,
      findings: findings,
      summary: {
        total_violations: findings.length,
        critical_violations: criticalImpactCount,
        passes_count: passes.length
      }
    };
  }
}

module.exports = {
  AxeAdapter
};
