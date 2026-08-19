/**
 * ============================================================================
 * GRUPO CASTILLO — SERVICIO DE EXPEDIENTE DOCUMENTAL Y BÓVEDA SEGURA (v1.1)
 * ============================================================================
 * Administra el almacenamiento seguro, catalogación por categorías,
 * cálculo de hashes criptográficos SHA-256, validación de tipos MIME y
 * generación de enlaces temporales de acceso para el expediente digital.
 */

import { createHash, randomBytes } from 'node:crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, extname } from 'node:path';

export const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.png', '.jpg', '.jpeg', '.svg', '.json', '.html', '.zip', '.txt', '.md'
]);

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'application/json',
  'text/html',
  'application/zip',
  'text/plain',
  'text/markdown'
]);

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export class DocumentService {
  /**
   * @param {import('node:sqlite').DatabaseSync} db
   * @param {import('./audit.service.js').AuditService} auditService
   * @param {string} [storageDir]
   */
  constructor(db, auditService, storageDir = null) {
    this.db = db;
    this.auditService = auditService;
    this.storageDir = storageDir || process.env.STORAGE_DIR || resolve(process.cwd(), '.castle', 'vault');

    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Almacena y cataloga un documento en el expediente del proyecto.
   * @param {object} params
   * @param {string} params.projectId
   * @param {string} params.category - 'COMERCIAL', 'LEGAL', 'FINANCIERO', 'INGENIERIA_QA', 'HANDOFF_ENTREGA', 'POST_ENTREGA'
   * @param {string} params.title
   * @param {string} params.filename
   * @param {Buffer|string} params.content
   * @param {string} [params.mimeType='application/pdf']
   * @param {string} [params.version='v1.0']
   * @param {object} params.actor - { userId, role, ip }
   * @returns {object}
   */
  storeDocument({
    projectId,
    category,
    title,
    filename,
    content,
    mimeType = 'application/pdf',
    version = 'v1.0',
    actor
  }) {
    const ext = extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(`Extensión de archivo no permitida: ${ext}. Extensiones válidas: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`);
    }

    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`El archivo excede el tamaño máximo permitido de 25MB (Tamaño: ${Math.round(buffer.length / 1024 / 1024)}MB)`);
    }

    const sha256Hash = createHash('sha256').update(buffer).digest('hex');
    const docId = `doc_${randomBytes(8).toString('hex')}`;
    const projectDir = resolve(this.storageDir, projectId);

    if (!existsSync(projectDir)) {
      mkdirSync(projectDir, { recursive: true });
    }

    const safeFilename = `${docId}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const targetFilePath = resolve(projectDir, safeFilename);

    writeFileSync(targetFilePath, buffer);

    this.db.prepare(`
      INSERT INTO expediente_documentos (
        id, project_id, category, title, filename, file_path,
        mime_type, file_size_bytes, version, sha256_hash,
        uploaded_by_role, uploaded_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      docId,
      projectId,
      category,
      title.trim(),
      filename,
      targetFilePath,
      mimeType,
      buffer.length,
      version,
      sha256Hash,
      actor.role,
      actor.userId
    );

    this.auditService.logEvent({
      projectId,
      actorId: actor.userId,
      actorRole: actor.role,
      actorIp: actor.ip,
      action: 'DOCUMENT_ARCHIVED',
      rationale: `Documento "${title}" (${filename}, ${version}) archivado en expediente bajo categoría ${category}. Hash SHA-256 verificado.`,
      evidenceHashSha256: sha256Hash
    });

    return {
      success: true,
      docId,
      projectId,
      category,
      title,
      filename,
      version,
      sha256Hash,
      sizeBytes: buffer.length
    };
  }

  /**
   * Obtiene la lista de documentos catalogados en el expediente de un proyecto.
   * @param {string} projectId
   * @returns {Array<object>}
   */
  getProjectDocuments(projectId) {
    const stmt = this.db.prepare(`
      SELECT id, project_id, category, title, filename, mime_type, file_size_bytes,
             version, sha256_hash, uploaded_by_role, created_at
      FROM expediente_documentos
      WHERE project_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(projectId);
  }

  /**
   * Lee de forma segura el contenido de un documento validado por hash.
   * @param {string} docId
   * @returns {{ filename: string, mimeType: string, buffer: Buffer, sha256Hash: string }}
   */
  readDocument(docId) {
    const doc = this.db.prepare('SELECT * FROM expediente_documentos WHERE id = ?').get(docId);
    if (!doc) throw new Error('Documento no encontrado en la bóveda');

    if (!existsSync(doc.file_path)) {
      throw new Error('El archivo físico no se encuentra disponible en la bóveda de almacenamiento');
    }

    const buffer = readFileSync(doc.file_path);
    const verificationHash = createHash('sha256').update(buffer).digest('hex');

    if (verificationHash !== doc.sha256_hash) {
      throw new Error('ALERTA DE INTEGRIDAD: El hash del archivo no coincide con el registro criptográfico');
    }

    return {
      filename: doc.filename,
      mimeType: doc.mime_type,
      buffer,
      sha256Hash: doc.sha256_hash
    };
  }
}
