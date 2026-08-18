/**
 * Castle Security & Quality Gate — Framework Mapping Engine
 * 
 * Computes traceability mappings from CQS v1.1 evaluation results to
 * OWASP ASVS, CWE, NIST SSDF, NOM-151, LFPDPPP, and CNBV.
 * 
 * Invariant: Clearly differentiates `MAPPED` from `COMPLIANT`.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const mappingsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'framework-mappings.json'), 'utf8')
);

/**
 * Computes external framework alignment report for a given CQS evaluation result.
 * 
 * @param {Object} cqsResult 
 * @returns {Object} Traceability Mapping Summary
 */
function mapEvaluationToFrameworks(cqsResult) {
  const evaluatedControls = {};
  if (cqsResult && cqsResult.domains) {
    for (const d of cqsResult.domains) {
      for (const s of d.subcriteria || []) {
        for (const c of s.controls || []) {
          evaluatedControls[c.control_id] = {
            status: c.status,
            score: c.score
          };
        }
      }
    }
  }

  const mappedResults = {
    disclaimer: mappingsData.disclaimer,
    owasp_asvs: { mapped: [], passing: 0, failing: 0 },
    cwe: { mapped: [], passing: 0, failing: 0 },
    nist_ssdf: { mapped: [], passing: 0, failing: 0 },
    mexican_regulatory: {
      lfpdppp: { mapped: [] },
      nom_151: { mapped: [] },
      cnbv_cub: { mapped: [] }
    }
  };

  // OWASP ASVS mapping
  for (const [cid, asvsInfo] of Object.entries(mappingsData.frameworks.OWASP_ASVS_v4.controls)) {
    const evalData = evaluatedControls[cid] || { status: 'UNEXECUTED' };
    const isPassing = evalData.status === 'PASS';
    if (isPassing) mappedResults.owasp_asvs.passing++;
    else if (evalData.status === 'FAIL') mappedResults.owasp_asvs.failing++;

    mappedResults.owasp_asvs.mapped.push({
      cqs_control_id: cid,
      asvs_id: asvsInfo.asvs_id,
      description: asvsInfo.description,
      status: evalData.status,
      alignment_status: 'MAPPED'
    });
  }

  // CWE mapping
  for (const [cid, cweInfo] of Object.entries(mappingsData.frameworks.CWE.controls)) {
    const evalData = evaluatedControls[cid] || { status: 'UNEXECUTED' };
    const isPassing = evalData.status === 'PASS';
    if (isPassing) mappedResults.cwe.passing++;
    else if (evalData.status === 'FAIL') mappedResults.cwe.failing++;

    mappedResults.cwe.mapped.push({
      cqs_control_id: cid,
      cwe_id: cweInfo.cwe_id,
      name: cweInfo.name,
      status: evalData.status,
      alignment_status: 'MAPPED'
    });
  }

  // NIST SSDF mapping
  for (const [cid, ssdfInfo] of Object.entries(mappingsData.frameworks.NIST_SSDF_v1_1.controls)) {
    const evalData = evaluatedControls[cid] || { status: 'UNEXECUTED' };
    const isPassing = evalData.status === 'PASS';
    if (isPassing) mappedResults.nist_ssdf.passing++;
    else if (evalData.status === 'FAIL') mappedResults.nist_ssdf.failing++;

    mappedResults.nist_ssdf.mapped.push({
      cqs_control_id: cid,
      practice: ssdfInfo.ssdf_practice,
      task: ssdfInfo.task,
      status: evalData.status,
      alignment_status: 'MAPPED'
    });
  }

  // Mexican Regulatory alignments
  const mex = mappingsData.frameworks.MEXICAN_REGULATORY.frameworks;
  for (const [cid, desc] of Object.entries(mex.LFPDPPP.controls)) {
    const evalData = evaluatedControls[cid] || { status: 'UNEXECUTED' };
    mappedResults.mexican_regulatory.lfpdppp.mapped.push({
      cqs_control_id: cid,
      regulatory_scope: desc,
      status: evalData.status,
      alignment_status: 'MAPPED'
    });
  }

  return mappedResults;
}

module.exports = {
  mappingsData,
  mapEvaluationToFrameworks
};
