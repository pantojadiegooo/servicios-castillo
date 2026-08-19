/**
 * ============================================================================
 * GRUPO CASTILLO — SERVICIO DE CONTRATACIÓN Y FIRMA DIGITAL (v1.1)
 * ============================================================================
 * Vincula el Contrato Marco (MSA) con las Condiciones Particulares del SOW,
 * genera el sellado criptográfico SHA-256 e instrumenta la firma formal
 * indispensable para superar la Regla NO START.
 */

import { createHash, randomBytes } from 'node:crypto';

export class ContractService {
  /**
   * @param {import('node:sqlite').DatabaseSync} db
   * @param {import('./audit.service.js').AuditService} auditService
   */
  constructor(db, auditService) {
    this.db = db;
    this.auditService = auditService;
  }

  /**
   * Genera el registro contractual inicial para un proyecto.
   * @param {string} projectId
   * @param {string} [msaVersion='v1.0.0']
   * @returns {object}
   */
  initializeContract(projectId, msaVersion = 'v1.0.0') {
    const contractId = `ctr_${randomBytes(6).toString('hex')}`;
    const sowReferenceId = `GC-SOW-${projectId.replace('GC-Q-', '')}`;

    this.db.prepare(`
      INSERT INTO contracts (
        id, project_id, msa_version, sow_reference_id, is_signed
      ) VALUES (?, ?, ?, ?, 0)
    `).run(contractId, projectId, msaVersion, sowReferenceId);

    return {
      contractId,
      projectId,
      msaVersion,
      sowReferenceId,
      isSigned: false
    };
  }

  /**
   * Obtiene el contrato asociado a un proyecto.
   * @param {string} projectId
   * @returns {object|null}
   */
  getContractByProject(projectId) {
    return this.db.prepare('SELECT * FROM contracts WHERE project_id = ?').get(projectId);
  }

  /**
   * Registra la firma y aceptación formal del contrato por el representante legal del cliente.
   * @param {string} projectId
   * @param {object} signatureData
   * @param {string} signatureData.signerName
   * @param {string} signatureData.signerTitle
   * @param {string} [signatureData.signerRfc]
   * @param {string} [signatureData.signerIp]
   * @returns {object}
   */
  signContract(projectId, { signerName, signerTitle, signerRfc = null, signerIp = null }) {
    if (!signerName || !signerTitle) {
      throw new Error('Nombre del firmante y cargo/título son obligatorios para formalizar el contrato');
    }

    let contract = this.getContractByProject(projectId);
    if (!contract) {
      this.initializeContract(projectId);
      contract = this.getContractByProject(projectId);
    }

    if (contract.is_signed === 1) {
      return { success: true, message: 'El contrato ya se encuentra firmado.', contract };
    }

    const signedAt = new Date().toISOString();
    const payloadToHash = JSON.stringify({
      contractId: contract.id,
      projectId,
      msaVersion: contract.msa_version,
      sowReferenceId: contract.sow_reference_id,
      signerName,
      signerTitle,
      signerRfc,
      signedAt
    });
    const contractHashSha256 = createHash('sha256').update(payloadToHash).digest('hex');

    this.db.prepare(`
      UPDATE contracts
      SET is_signed = 1, signed_at = ?, signer_name = ?, signer_title = ?,
          signer_rfc = ?, signer_ip_address = ?, contract_hash_sha256 = ?
      WHERE id = ?
    `).run(signedAt, signerName, signerTitle, signerRfc, signerIp, contractHashSha256, contract.id);

    this.auditService.logEvent({
      projectId,
      actorId: signerName,
      actorRole: 'CLIENTE',
      actorIp: signerIp,
      action: 'CONTRACT_SIGNED',
      rationale: `Contrato Marco ${contract.msa_version} y SOW ${contract.sow_reference_id} firmados formalmente por ${signerName} (${signerTitle})`,
      evidenceHashSha256: contractHashSha256
    });

    return {
      success: true,
      contractId: contract.id,
      projectId,
      signedAt,
      contractHashSha256
    };
  }
}
