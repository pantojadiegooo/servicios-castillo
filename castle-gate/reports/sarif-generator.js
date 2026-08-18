/**
 * Castle Security & Quality Gate — SARIF v2.1.0 Report Generator
 * 
 * Generates standard OASIS Static Analysis Results Interchange Format (SARIF) v2.1.0
 * for seamless native integration into GitHub Code Scanning, GitLab SAST, and Azure DevOps.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SARIF_SCHEMA = 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json';
const SARIF_VERSION = '2.1.0';

/**
 * Maps Castle Gate finding severity to standard SARIF level.
 * 
 * @param {string} severity 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'|'INFO'
 * @returns {string} 'error'|'warning'|'note'
 */
function mapSeverityToSarifLevel(severity) {
  const sev = (severity || 'MEDIUM').toUpperCase();
  if (sev === 'CRITICAL' || sev === 'HIGH' || sev === 'ERROR') {
    return 'error';
  } else if (sev === 'MEDIUM' || sev === 'WARNING') {
    return 'warning';
  }
  return 'note';
}

/**
 * Converts Castle Gate findings and evaluation into a valid SARIF v2.1.0 report object.
 * 
 * @param {Object} params { findings, target_system, cqs_result, gate_decision }
 * @returns {Object} SARIF v2.1.0 Report Object
 */
function generateSarifReport(params) {
  const {
    detailed_findings = {},
    target_system = {},
    cqs_result = {},
    gate_decision = {},
    run_id = null
  } = params;

  const rulesMap = new Map();
  const results = [];

  // Sort probe names for determinism
  const sortedProbeNames = Object.keys(detailed_findings).sort();

  // Iterate over findings across all probes/adapters
  for (const probeName of sortedProbeNames) {
    const probeFindings = detailed_findings[probeName];
    if (!probeFindings) continue;

    // Handle probeFindings being either an Array or an Object with categories
    let findingList = [];
    if (Array.isArray(probeFindings)) {
      findingList = probeFindings;
    } else if (typeof probeFindings === 'object') {
      const sortedCats = Object.keys(probeFindings).sort();
      for (const cat of sortedCats) {
        const catList = probeFindings[cat];
        if (Array.isArray(catList)) {
          findingList.push(...catList);
        }
      }
    }

    for (const f of findingList) {
      const ruleId = f.rule || f.rule_id || 'CASTLE-RULE';
      const severity = f.severity || 'MEDIUM';
      const sarifLevel = mapSeverityToSarifLevel(severity);
      const message = f.description || f.message || 'Deficiency detected by Castle Gate';
      const fileUri = (f.file || 'unknown').replace(/\\/g, '/');
      const startLine = Math.max(1, parseInt(f.line || 1, 10));
      const startCol = Math.max(1, parseInt(f.column || 1, 10));

      if (!rulesMap.has(ruleId)) {
        rulesMap.set(ruleId, {
          id: ruleId,
          name: ruleId.replace(/[^a-zA-Z0-9]/g, '_'),
          shortDescription: {
            text: message
          },
          fullDescription: {
            text: `Detected by ${probeName} (Associated CQS Control: ${f.cqs_control_id || 'N/A'})`
          },
          defaultConfiguration: {
            level: sarifLevel
          },
          properties: {
            tags: ['security', 'quality', 'governance', 'castle-gate', f.cqs_control_id].filter(Boolean),
            precision: 'high'
          }
        });
      }

      results.push({
        ruleId: ruleId,
        level: sarifLevel,
        message: {
          text: message
        },
        locations: [
          {
            physicalLocation: {
              artifactLocation: {
                uri: fileUri,
                uriBaseId: '%SRCROOT%'
              },
              region: {
                startLine: startLine,
                startColumn: startCol
              }
            }
          }
        ],
        properties: {
          severity: severity,
          cqs_control_id: f.cqs_control_id || null,
          details: f.details || {}
        }
      });
    }
  }

  const automationId = run_id || (cqs_result && cqs_result.evaluation_id) || (target_system && target_system.commit_sha ? `CASTLE-RUN-${target_system.commit_sha}` : 'CASTLE-RUN-CANONICAL');

  const sarifLog = {
    $schema: SARIF_SCHEMA,
    version: SARIF_VERSION,
    runs: [
      {
        tool: {
          driver: {
            name: 'Castle Gate Assurance Engine',
            version: (gate_decision.versioning && gate_decision.versioning.gate_version) || '1.0.0',
            informationUri: 'https://grupocastillo.com/castle-gate',
            rules: Array.from(rulesMap.values())
          }
        },
        automationDetails: {
          id: automationId
        },
        results: results
      }
    ]
  };

  return sarifLog;
}

/**
 * Exports SARIF report to a file.
 * 
 * @param {Object} sarifLog 
 * @param {string} outputDir 
 * @param {string} [fileName='sarif.json'] 
 * @returns {string} Exported file path
 */
function exportSarifToFile(sarifLog, outputDir, fileName = 'sarif.json') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const targetPath = path.join(outputDir, fileName);
  fs.writeFileSync(targetPath, JSON.stringify(sarifLog, null, 2), 'utf8');
  return targetPath;
}

module.exports = {
  SARIF_VERSION,
  SARIF_SCHEMA,
  generateSarifReport,
  exportSarifToFile
};
