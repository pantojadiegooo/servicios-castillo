/**
 * ============================================================================
 * GRUPO CASTILLO — SERVICIO DE AUDITORÍA INMUTABLE (v1.1)
 * ============================================================================
 * Registra todas las mutaciones administrativas, transiciones de estado,
 * firmas de contrato y eventos de pago en una bitácora append-only.
 * NUNCA registra contraseñas, tokens OTP, secretos ni llaves de API.
 */

import { generateAuditEventId } from '../core/id-generator.js';

export class AuditService {
  /**
   * @param {import('node:sqlite').DatabaseSync} db
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Registra un evento de auditoría estructurado.
   * @param {object} params
   * @param {string|null} [params.projectId]
   * @param {string} params.actorId
   * @param {string} params.actorRole
   * @param {string|null} [params.actorIp]
   * @param {string} params.action
   * @param {string|null} [params.fromState]
   * @param {string|null} [params.toState]
   * @param {string} params.rationale
   * @param {string|null} [params.evidenceHashSha256]
   * @param {object} [params.metadata]
   * @returns {object}
   */
  logEvent({
    projectId = null,
    actorId,
    actorRole,
    actorIp = null,
    action,
    fromState = null,
    toState = null,
    rationale,
    evidenceHashSha256 = null,
    metadata = {}
  }) {
    if (!actorId || !actorRole || !action || !rationale) {
      throw new Error('Parámetros de auditoría incompletos: actorId, actorRole, action y rationale son obligatorios');
    }

    const eventId = generateAuditEventId();
    const nowUtc = new Date().toISOString();

    // Sanitizar metadata para asegurar que no contenga secretos
    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.otp;
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.secret;
    delete sanitizedMetadata.apiKey;

    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (
        id, project_id, actor_id, actor_role, actor_ip,
        action, from_state, to_state, rationale, evidence_hash_sha256,
        metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      eventId,
      projectId,
      actorId,
      actorRole,
      actorIp,
      action,
      fromState,
      toState,
      rationale,
      evidenceHashSha256,
      JSON.stringify(sanitizedMetadata),
      nowUtc
    );

    return {
      id: eventId,
      projectId,
      actorId,
      actorRole,
      action,
      fromState,
      toState,
      rationale,
      createdAt: nowUtc
    };
  }

  /**
   * Obtiene la bitácora de auditoría de un proyecto.
   * @param {string} projectId
   * @returns {Array<object>}
   */
  getProjectAuditTrail(projectId) {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_logs
      WHERE project_id = ?
      ORDER BY created_at ASC
    `);
    return stmt.all(projectId);
  }

  /**
   * Obtiene los últimos N eventos de auditoría globales (solo para Administración).
   * @param {number} [limit=50]
   * @returns {Array<object>}
   */
  getGlobalAuditTrail(limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_logs
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }
}
