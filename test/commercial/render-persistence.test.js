/**
 * ============================================================================
 * PRUEBA DE PERSISTENCIA Y COMPATIBILIDAD CON RENDER PERSISTENT DISK (v1.1)
 * ============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { rmSync, existsSync } from 'node:fs';
import { createDatabase } from '../../src/commercial/db/database.js';
import { AuditService } from '../../src/commercial/services/audit.service.js';
import { DocumentService } from '../../src/commercial/services/document.service.js';
import { ROLES } from '../../src/commercial/core/roles.js';

test('Render Persistent Disk — Simulación de reinicio de contenedor con DB_PATH y STORAGE_DIR', () => {
  const testDisk = resolve(process.cwd(), '.test_render_disk');
  const dbPath = resolve(testDisk, '.castle', 'commercial.sqlite');
  const storageDir = resolve(testDisk, '.castle', 'vault');

  if (existsSync(testDisk)) {
    rmSync(testDisk, { recursive: true, force: true });
  }

  // 1. Primer arranque: Creación automática de directorios y esquema DDL
  let db = createDatabase(dbPath);
  let audit = new AuditService(db);
  let docService = new DocumentService(db, audit, storageDir);

  db.prepare(`
    INSERT INTO clients (id, business_name, contact_name, contact_email)
    VALUES ('cli_render_1', 'Render Persistence S.A.', 'Carlos Render', 'carlos@render.com')
  `).run();

  db.prepare(`
    INSERT INTO projects (id, client_id, service_package_id, service_type, name, state)
    VALUES ('GC-Q-2026-000999', 'cli_render_1', 'gold', 'BUILD_PACKAGE', 'Render Disk Test', 'ACTIVE')
  `).run();

  const stored = docService.storeDocument({
    projectId: 'GC-Q-2026-000999',
    category: 'LEGAL',
    title: 'Contrato Marco Persistente',
    filename: 'contrato_render.pdf',
    content: '%PDF-1.4 Render Persistent Disk Content Verification',
    actor: { userId: 'usr_admin_01', role: ROLES.ADMINISTRACION }
  });

  assert.ok(stored.docId);
  assert.ok(stored.sha256Hash);

  // 2. Simular reinicio de contenedor de Render (cierre de proceso y reapertura)
  db.close();

  // 3. Segundo arranque: Apertura sobre el disco persistente sin pérdida de datos
  db = createDatabase(dbPath);
  audit = new AuditService(db);
  docService = new DocumentService(db, audit, storageDir);

  const projectRow = db.prepare('SELECT * FROM projects WHERE id = ?').get('GC-Q-2026-000999');
  assert.equal(projectRow.name, 'Render Disk Test');

  const readDoc = docService.readDocument(stored.docId);
  assert.equal(readDoc.sha256Hash, stored.sha256Hash);
  assert.equal(readDoc.buffer.toString('utf-8'), '%PDF-1.4 Render Persistent Disk Content Verification');

  // Limpieza
  db.close();
  rmSync(testDisk, { recursive: true, force: true });
});
