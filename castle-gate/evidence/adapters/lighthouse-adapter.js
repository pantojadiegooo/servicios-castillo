/**
 * Castle Security & Quality Gate — Lighthouse Evidence Adapter
 * 
 * Ingests Google Lighthouse JSON audit output and maps objective measurements
 * into CQS atomic control evidence without modifying scoring logic.
 * 
 * Supports policy-aware Core Web Vitals thresholds (C1-C6):
 * - C1 (Foundation): LCP <= 4000ms, CLS <= 0.25, TBT <= 500ms
 * - C2-C4 (Enterprise Baseline): LCP <= 2500ms, CLS <= 0.10, TBT <= 200ms
 * - C5-C6 (Critical Infrastructure): LCP <= 1800ms, CLS <= 0.05, TBT <= 100ms
 */

'use strict';

const { BaseEvidenceAdapter } = require('./base-adapter');

const CWV_POLICY_THRESHOLDS = Object.freeze({
  C1: { lcp: 4000, cls: 0.25, tbt: 500 },
  C2: { lcp: 2500, cls: 0.10, tbt: 200 },
  C3: { lcp: 2500, cls: 0.10, tbt: 200 },
  C4: { lcp: 2500, cls: 0.10, tbt: 200 },
  C5: { lcp: 1800, cls: 0.05, tbt: 100 },
  C6: { lcp: 1800, cls: 0.05, tbt: 100 }
});

class LighthouseAdapter extends BaseEvidenceAdapter {
  constructor() {
    super('LighthouseEvidenceAdapter', 'Google Lighthouse');
  }

  /**
   * Parses Lighthouse JSON output and extracts CQS control statuses.
   * 
   * @param {Object|string} lighthouseJson 
   * @param {Object} [options] { gateLevel?: string, customThresholds?: Object }
   * @returns {Object} { controls, provenance, linked_evidence, findings }
   */
  parse(lighthouseJson, options = {}) {
    let rawData = lighthouseJson;
    if (typeof lighthouseJson === 'string') {
      try {
        rawData = JSON.parse(lighthouseJson);
      } catch (err) {
        throw new Error(`[LighthouseAdapter] Invalid Lighthouse JSON: ${err.message}`);
      }
    }

    const rawHash = this.hashRawData(rawData);

    if (!rawData || !rawData.audits) {
      throw new Error('[LighthouseAdapter] Invalid Lighthouse JSON: Missing "audits" object.');
    }

    const gateLevel = (options.gateLevel || 'C1').toUpperCase();
    const thresholds = options.customThresholds || CWV_POLICY_THRESHOLDS[gateLevel] || CWV_POLICY_THRESHOLDS.C2;

    const audits = rawData.audits;
    const controls = {};
    const findings = [];

    // 1. PER-01.1: Largest Contentful Paint (LCP)
    if (audits['largest-contentful-paint']) {
      const lcpVal = audits['largest-contentful-paint'].numericValue;
      const lcpPassed = typeof lcpVal === 'number' && lcpVal <= thresholds.lcp;
      controls['PER-01.1'] = {
        status: lcpPassed ? 'PASS' : 'FAIL',
        details: `LCP: ${lcpVal ? (lcpVal / 1000).toFixed(2) : 'N/A'}s (Policy ${gateLevel} Target <= ${(thresholds.lcp / 1000).toFixed(2)}s)`,
        numeric_value: lcpVal,
        threshold: thresholds.lcp
      };
      if (!lcpPassed) {
        findings.push(this.createNormalizedFinding({
          ruleId: 'LIGHTHOUSE_LCP_SLOW',
          severity: lcpVal > 4000 ? 'HIGH' : 'MEDIUM',
          controlId: 'PER-01.1',
          file: 'DOM-Runtime',
          line: 1,
          column: 1,
          message: `LCP (${(lcpVal / 1000).toFixed(2)}s) exceeds policy threshold of ${(thresholds.lcp / 1000).toFixed(2)}s`
        }));
      }
    }

    // 2. PER-03.1: Cumulative Layout Shift (CLS)
    if (audits['cumulative-layout-shift']) {
      const clsVal = audits['cumulative-layout-shift'].numericValue;
      const clsPassed = typeof clsVal === 'number' && clsVal <= thresholds.cls;
      controls['PER-03.1'] = {
        status: clsPassed ? 'PASS' : 'FAIL',
        details: `CLS: ${clsVal !== undefined ? clsVal.toFixed(3) : 'N/A'} (Policy ${gateLevel} Target <= ${thresholds.cls})`,
        numeric_value: clsVal,
        threshold: thresholds.cls
      };
      if (!clsPassed) {
        findings.push(this.createNormalizedFinding({
          ruleId: 'LIGHTHOUSE_CLS_UNSTABLE',
          severity: clsVal > 0.25 ? 'HIGH' : 'MEDIUM',
          controlId: 'PER-03.1',
          file: 'DOM-Runtime',
          line: 1,
          column: 1,
          message: `CLS (${clsVal.toFixed(3)}) exceeds layout stability threshold of ${thresholds.cls}`
        }));
      }
    }

    // 3. PER-02.1: Total Blocking Time / INP Responsiveness proxy
    if (audits['total-blocking-time']) {
      const tbtVal = audits['total-blocking-time'].numericValue;
      const tbtPassed = typeof tbtVal === 'number' && tbtVal <= thresholds.tbt;
      controls['PER-02.1'] = {
        status: tbtPassed ? 'PASS' : 'FAIL',
        details: `TBT: ${tbtVal !== undefined ? tbtVal.toFixed(0) : 'N/A'}ms (Policy ${gateLevel} Target <= ${thresholds.tbt}ms)`,
        numeric_value: tbtVal,
        threshold: thresholds.tbt
      };
      if (!tbtPassed) {
        findings.push(this.createNormalizedFinding({
          ruleId: 'LIGHTHOUSE_TBT_BLOCKING',
          severity: tbtVal > 600 ? 'HIGH' : 'MEDIUM',
          controlId: 'PER-02.1',
          file: 'DOM-Runtime',
          line: 1,
          column: 1,
          message: `Total Blocking Time (${tbtVal.toFixed(0)}ms) exceeds interactivity threshold of ${thresholds.tbt}ms`
        }));
      }
    }

    // 4. PER-04.1: Modern Image Formats (WebP / AVIF)
    if (audits['modern-image-formats']) {
      const score = audits['modern-image-formats'].score;
      controls['PER-04.1'] = {
        status: score === 1 ? 'PASS' : (score === null ? 'N/A' : 'FAIL'),
        details: audits['modern-image-formats'].displayValue || 'Modern image format verification'
      };
    }

    // 5. PER-04.3: Text Compression (Gzip / Brotli)
    if (audits['uses-text-compression']) {
      const score = audits['uses-text-compression'].score;
      controls['PER-04.3'] = {
        status: score === 1 ? 'PASS' : (score === null ? 'N/A' : 'FAIL'),
        details: audits['uses-text-compression'].displayValue || 'Text compression check'
      };
    }

    // 6. SEC-01.2: HTTPS Delivery
    if (audits['is-on-https']) {
      controls['SEC-01.2'] = {
        status: audits['is-on-https'].score === 1 ? 'PASS' : 'FAIL',
        details: audits['is-on-https'].explanation || 'HTTPS verification'
      };
    }

    // 7. ACC-01.2: Heading Order
    if (audits['heading-order']) {
      controls['ACC-01.2'] = {
        status: audits['heading-order'].score === 1 ? 'PASS' : 'FAIL',
        details: 'Heading hierarchy evaluation'
      };
    }

    // 8. ACC-03.1: Color Contrast
    if (audits['color-contrast']) {
      controls['ACC-03.1'] = {
        status: audits['color-contrast'].score === 1 ? 'PASS' : 'FAIL',
        details: 'Color contrast ratio evaluation'
      };
    }

    // 9. SEO-02.1: Page Title
    if (audits['document-title']) {
      controls['SEO-02.1'] = {
        status: audits['document-title'].score === 1 ? 'PASS' : 'FAIL',
        details: 'Document title presence'
      };
    }

    // 10. SEO-02.2: Meta Description
    if (audits['meta-description']) {
      controls['SEO-02.2'] = {
        status: audits['meta-description'].score === 1 ? 'PASS' : 'FAIL',
        details: 'Meta description presence'
      };
    }

    // 11. UX-01.1: Viewport
    if (audits['viewport']) {
      controls['UX-01.1'] = {
        status: audits['viewport'].score === 1 ? 'PASS' : 'FAIL',
        details: 'Viewport configuration'
      };
    }

    // 12. UX-02.1: Tap Targets
    if (audits['tap-targets']) {
      controls['UX-02.1'] = {
        status: audits['tap-targets'].score === 1 ? 'PASS' : 'FAIL',
        details: 'Tap target sizing standard'
      };
    }

    return {
      source_tool: this.sourceTool,
      extracted_at: new Date().toISOString(),
      raw_payload_sha256: rawHash,
      controls: controls,
      findings: findings,
      provenance: {
        tool: this.sourceTool,
        version: rawData.lighthouseVersion || '11.0.0',
        timestamp: rawData.fetchTime || new Date().toISOString(),
        raw_payload_hash: rawHash,
        target_url: rawData.finalUrl || rawData.requestedUrl || 'http://localhost'
      },
      linked_evidence: {
        evidence_type: 'LIGHTHOUSE_CWV_REPORT',
        raw_payload_hash: rawHash,
        status: 'VERIFIED_INGESTION'
      }
    };
  }
}

module.exports = {
  LighthouseAdapter,
  CWV_POLICY_THRESHOLDS
};

