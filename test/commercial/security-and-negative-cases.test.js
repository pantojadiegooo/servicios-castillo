/**
 * ============================================================================
 * PRUEBAS DE CASOS NEGATIVOS, SEGURIDAD Y PROTOCOLO PROYECTO HIELO (v1.1)
 * ============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase } from '../../src/commercial/db/database.js';
import { AuditService } from '../../src/commercial/services/audit.service.js';
import { QuotationService } from '../../src/commercial/services/quotation.service.js';
import { ContractService } from '../../src/commercial/services/contract.service.js';
import { ProjectService } from '../../src/commercial/services/project.service.js';
import { DocumentService } from '../../src/commercial/services/document.service.js';
import { PROJECT_STATES } from '../../src/commercial/core/state-machine.js';
import { ROLES } from '../../src/commercial/core/roles.js';

test('Casos Negativos & Seguridad — Regla NO START infranqueable', () => {
  const db = createDatabase(':memory:');
  const auditService = new AuditService(db);
  const quotationService = new QuotationService(db, auditService);
  const contractService = new ContractService(db, auditService);
  const projectService = new ProjectService(db, auditService);

  const quote = quotationService.createQuotation({
    businessName: 'Security Test S.A.',
    contactName: 'Daniel Vega',
    contactEmail: 'daniel@securitytest.com',
    serviceCode: 'IRON',
    projectName: 'Proyecto Seguridad',
    scopeDescription: 'Landing One-Page',
    createdBy: 'usr_admin_01'
  });
  const projectId = quote.projectId;

  // Intento 1: Activar sin haber aceptado cotización, sin contrato y sin pago
  assert.throws(() => {
    projectService.activateProject(projectId, 'usr_admin_01', 'usr_eng_01');
  }, /REGLA NO START ACTIVA/);

  // Aceptar cotización pero no firmar contrato ni pagar
  quotationService.acceptQuotation(projectId, {
    acceptedByName: 'Daniel Vega',
    acceptedByEmail: 'daniel@securitytest.com'
  });

  // Intento 2: Activar con cotización aceptada pero sin contrato ni pago
  assert.throws(() => {
    projectService.activateProject(projectId, 'usr_admin_01', 'usr_eng_01');
  }, /El contrato marco y SOW no han sido firmados/);

  // Firmar contrato pero no pagar
  contractService.initializeContract(projectId);
  contractService.signContract(projectId, {
    signerName: 'Daniel Vega',
    signerTitle: 'Director',
    signerRfc: 'VEGA900101'
  });

  // Intento 3: Activar sin pago verificado
  assert.throws(() => {
    projectService.activateProject(projectId, 'usr_admin_01', 'usr_eng_01');
  }, /El pago inicial .* no ha sido confirmado/);
});

test('Casos Negativos — Cotización expirada tras 15 días naturales', () => {
  const db = createDatabase(':memory:');
  const auditService = new AuditService(db);
  const quotationService = new QuotationService(db, auditService);

  const quote = quotationService.createQuotation({
    businessName: 'Expired Test',
    contactName: 'Marcos Soto',
    contactEmail: 'marcos@expired.com',
    serviceCode: 'BRONZE',
    projectName: 'Proyecto Expirado',
    scopeDescription: 'Landing 5 secciones',
    createdBy: 'usr_admin_01'
  });

  // Forzar fecha de expiración en el pasado
  db.prepare(`
    UPDATE quotation_versions
    SET valid_until_date = datetime('now', '-1 day')
    WHERE project_id = ?
  `).run(quote.projectId);

  // Intento de aceptación debe fallar
  assert.throws(() => {
    quotationService.acceptQuotation(quote.projectId, {
      acceptedByName: 'Marcos Soto',
      acceptedByEmail: 'marcos@expired.com'
    });
  }, /La cotización ha expirado/);
});

test('Casos Negativos — Seguridad en Bóveda Documental (MIME y Hashes)', () => {
  const db = createDatabase(':memory:');
  const auditService = new AuditService(db);
  const documentService = new DocumentService(db, auditService);

  db.prepare(`
    INSERT INTO clients (id, business_name, contact_name, contact_email)
    VALUES ('cli_sec_1', 'Sec Corp', 'Elena Vault', 'elena@vault.com')
  `).run();

  db.prepare(`
    INSERT INTO projects (id, client_id, service_package_id, service_type, name, state)
    VALUES ('GC-Q-2026-000042', 'cli_sec_1', 'gold', 'BUILD_PACKAGE', 'Portal Vault', 'ACTIVE')
  `).run();

  // Intento 1: Subir extensión no permitida (.exe)
  assert.throws(() => {
    documentService.storeDocument({
      projectId: 'GC-Q-2026-000042',
      category: 'LEGAL',
      title: 'Virus Malware',
      filename: 'malware.exe',
      content: Buffer.from('executable binary code'),
      actor: { userId: 'attacker', role: ROLES.CLIENTE }
    });
  }, /Extensión de archivo no permitida/);

  // Subir archivo legal válido
  const stored = documentService.storeDocument({
    projectId: 'GC-Q-2026-000042',
    category: 'LEGAL',
    title: 'Contrato Marco Sellado',
    filename: 'contrato_firmado.pdf',
    content: '%PDF-1.4 Mock Legal Document Content',
    actor: { userId: 'usr_admin_01', role: ROLES.ADMINISTRACION }
  });
  assert.ok(stored.sha256Hash);

  // Lectura segura con verificación de hash
  const readRes = documentService.readDocument(stored.docId);
  assert.equal(readRes.sha256Hash, stored.sha256Hash);
});

test('Protocolo de Proyecto Hielo — Alertas escalonadas y reactivación formal', () => {
  const db = createDatabase(':memory:');
  const auditService = new AuditService(db);
  const projectService = new ProjectService(db, auditService);

  db.prepare(`
    INSERT INTO clients (id, business_name, contact_name, contact_email)
    VALUES ('cli_ice_1', 'Ice Corp', 'Lucía Flores', 'lucia@icecorp.com')
  `).run();

  db.prepare(`
    INSERT INTO projects (id, client_id, assigned_engineer_id, service_package_id, service_type, name, state)
    VALUES ('GC-Q-2026-000500', 'cli_ice_1', 'usr_eng_01', 'gold', 'BUILD_PACKAGE', 'Portal Ice', 'DEVELOPMENT')
  `).run();

  // Día 5: Sin alerta aún
  let res = projectService.processInactivityCheck('GC-Q-2026-000500', 5);
  assert.equal(res.alertsSent, 0);
  assert.equal(res.canBeFrozenByAdmin, false);

  // Día 8: Alerta 1
  res = projectService.processInactivityCheck('GC-Q-2026-000500', 8);
  assert.equal(res.alertsSent, 1);
  assert.equal(res.newAlertTriggered, true);
  assert.equal(res.canBeFrozenByAdmin, false);

  // Intento de congelar con solo 1 alerta debe fallar
  assert.throws(() => {
    projectService.freezeProject('GC-Q-2026-000500', 'usr_admin_01', 'Congelamiento prematuro');
  }, /deben haberse emitido las 3 alertas/);

  // Día 12: Alerta 2
  res = projectService.processInactivityCheck('GC-Q-2026-000500', 12);
  assert.equal(res.alertsSent, 2);

  // Día 15: Alerta 3
  res = projectService.processInactivityCheck('GC-Q-2026-000500', 15);
  assert.equal(res.alertsSent, 3);
  assert.equal(res.canBeFrozenByAdmin, true);

  // Ahora Administración congela oficialmente
  const freezeRes = projectService.freezeProject('GC-Q-2026-000500', 'usr_admin_01', 'Inactividad persistente tras 3 avisos');
  assert.equal(freezeRes.state, PROJECT_STATES.PROJECT_FROZEN);

  // Cliente solicita reactivación
  const reactReq = projectService.requestReactivation('GC-Q-2026-000500', {
    userId: 'lucia@icecorp.com',
    role: ROLES.CLIENTE
  });
  assert.equal(reactReq.state, PROJECT_STATES.REACTIVATION_PENDING);

  // Administración aprueba reactivación con nueva fecha
  const reactApprove = projectService.approveReactivation(
    'GC-Q-2026-000500',
    'usr_admin_01',
    '2026-10-15',
    'Capacidad de equipo verificada.'
  );
  assert.equal(reactApprove.state, PROJECT_STATES.DEVELOPMENT);
  assert.equal(reactApprove.newTargetDeliveryDate, '2026-10-15');
});
