/**
 * Castle Quality System (CQS) v1.1 — Main Entrypoint
 * 
 * Principle: "La metodología es la autoridad; el software únicamente la ejecuta."
 */

'use strict';

const { evaluateCqs, loadNormativeAssets } = require('./engine/evaluator');
const { validateCqsIntegrity, validateEvidencePayload } = require('./engine/validator');
const { generateAuditMarkdownReport } = require('./engine/reporter');
const {
  STATUS_PASS,
  STATUS_FAIL,
  STATUS_NA,
  STATUS_UNEXECUTED,
  VALID_STATUSES
} = require('./scoring/scoring-model');
const { processControlEvidence, FIELD_CONTROLS, LAB_CONTROLS } = require('./evidence/evidence-model');

module.exports = {
  // Core Engine Operations
  evaluateCqs,
  loadNormativeAssets,
  validateCqsIntegrity,
  validateEvidencePayload,
  generateAuditMarkdownReport,
  processControlEvidence,

  // Normative Constants
  STATUS_PASS,
  STATUS_FAIL,
  STATUS_NA,
  STATUS_UNEXECUTED,
  VALID_STATUSES,
  FIELD_CONTROLS,
  LAB_CONTROLS
};
