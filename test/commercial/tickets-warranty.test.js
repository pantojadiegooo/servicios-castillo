/**
 * ============================================================================
 * PRUEBAS: TICKETS, SEVERIDADES CONGELADAS S1-S4 Y GARANTÍA (v1.1)
 * ============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase } from '../../src/commercial/db/database.js';
import { AuditService } from '../../src/commercial/services/audit.service.js';
import { ProjectService } from '../../src/commercial/services/project.service.js';
import { TicketService, TICKET_SEVERITIES } from '../../src/commercial/services/ticket.service.js';
import { PROJECT_STATES } from '../../src/commercial/core/state-machine.js';
import { ROLES } from '../../src/commercial/core/roles.js';

test('Tickets & Garantía — Severidades S1-S4, incidentes y cierre exclusivo por cliente', () => {
  const db = createDatabase(':memory:');
  const auditService = new AuditService(db);
  const projectService = new ProjectService(db, auditService);
  const ticketService = new TicketService(db, auditService, projectService);

  // Crear cliente y proyecto en estado WARRANTY
  db.prepare(`
    INSERT INTO clients (id, business_name, contact_name, contact_email)
    VALUES ('cli_tkt_1', 'Omni Corp', 'Elena Ramos', 'elena@omnicorp.com')
  `).run();

  db.prepare(`
    INSERT INTO projects (id, client_id, assigned_engineer_id, service_package_id, service_type, name, state)
    VALUES ('GC-Q-2026-000400', 'cli_tkt_1', 'usr_eng_01', 'gold', 'BUILD_PACKAGE', 'Portal Omni', 'WARRANTY')
  `).run();

  // 1. Verificación de SLAs por severidad
  assert.equal(TICKET_SEVERITIES.S1.slaResponseHours, 4);
  assert.equal(TICKET_SEVERITIES.S2.slaResponseHours, 8);
  assert.equal(TICKET_SEVERITIES.S3.slaResponseHours, 24);
  assert.equal(TICKET_SEVERITIES.S4.slaResponseHours, 48);

  // 2. Abrir ticket S2 en WARRANTY -> NO debe transicionar a INCIDENT_OPEN
  ticketService.createTicket({
    projectId: 'GC-Q-2026-000400',
    title: 'Falla menor en visualización móvil de galería',
    description: 'En pantallas pequeñas la galería se desborda levemente.',
    severity: 'S2',
    actor: { userId: 'elena@omnicorp.com', name: 'Elena Ramos', role: ROLES.CLIENTE }
  });
  let project = projectService.getProjectById('GC-Q-2026-000400');
  assert.equal(project.state, PROJECT_STATES.WARRANTY, 'Ticket S2 no debe forzar INCIDENT_OPEN');

  // 3. Abrir ticket S1 crítico en proyecto en garantía -> Transiciona a INCIDENT_OPEN
  const tktRes1 = ticketService.createTicket({
    projectId: 'GC-Q-2026-000400',
    title: 'Formulario de contacto arroja error 500 en producción',
    description: 'Los clientes no pueden enviar cotizaciones desde el sitio principal.',
    severity: 'S1',
    evidenceUrls: ['https://storage.castillo.com/evidencia/error500.png'],
    actor: { userId: 'elena@omnicorp.com', name: 'Elena Ramos', role: ROLES.CLIENTE, ip: '189.10.20.30' }
  });

  assert.ok(tktRes1.ticketId.startsWith('GC-T-2026-'));
  assert.equal(tktRes1.severity, 'S1');
  assert.equal(tktRes1.clientFacingStatus, 'Recibido');

  project = projectService.getProjectById('GC-Q-2026-000400');
  assert.equal(project.state, PROJECT_STATES.INCIDENT_OPEN, 'Ticket S1 debe activar INCIDENT_OPEN');

  // 4. Abrir un segundo ticket S1 crítico simultáneo
  const tktRes2 = ticketService.createTicket({
    projectId: 'GC-Q-2026-000400',
    title: 'Base de datos arroja timeout en checkout',
    description: 'Falla crítica de backend.',
    severity: 'S1',
    actor: { userId: 'elena@omnicorp.com', name: 'Elena Ramos', role: ROLES.CLIENTE }
  });

  // 5. Ingeniero responde con nota interna y respuesta al cliente
  ticketService.addMessage(
    tktRes1.ticketId,
    'Investigación: Llave de API SendGrid caducada en variables de Vercel.',
    [],
    true, // Nota interna
    { userId: 'usr_eng_01', name: 'Alejandro Morales', role: ROLES.INGENIERO }
  );

  ticketService.addMessage(
    tktRes1.ticketId,
    'Hola Elena, hemos identificado la causa y estamos actualizando las credenciales de correo.',
    [],
    false, // Mensaje público
    { userId: 'usr_eng_01', name: 'Alejandro Morales', role: ROLES.INGENIERO }
  );

  // 6. Verificar que el cliente NO ve la nota interna
  const clientTickets = ticketService.getProjectTickets('GC-Q-2026-000400', ROLES.CLIENTE);
  const t1Client = clientTickets.find(t => t.id === tktRes1.ticketId);
  const clientMsgCount = t1Client.messages.length;

  const engTickets = ticketService.getProjectTickets('GC-Q-2026-000400', ROLES.INGENIERO);
  const t1Eng = engTickets.find(t => t.id === tktRes1.ticketId);
  const engMsgCount = t1Eng.messages.length;

  assert.equal(engMsgCount, clientMsgCount + 1, 'El cliente no debe ver notas internas de ingeniería');

  // 7. Ingeniero resuelve el primer ticket S1, pero el segundo S1 sigue activo
  ticketService.resolveTicketInternal(
    tktRes1.ticketId,
    'Credenciales rotadas en Vercel. Formulario probado y operativo.',
    { userId: 'usr_eng_01', name: 'Alejandro Morales', role: ROLES.INGENIERO }
  );

  project = projectService.getProjectById('GC-Q-2026-000400');
  assert.equal(project.state, PROJECT_STATES.INCIDENT_OPEN, 'Debe permanecer en INCIDENT_OPEN mientras quede un S1 activo');

  // 8. Ingeniero resuelve el segundo ticket S1 -> Ahora sí retorna a WARRANTY
  ticketService.resolveTicketInternal(
    tktRes2.ticketId,
    'Pool de conexiones ajustado.',
    { userId: 'usr_eng_01', name: 'Alejandro Morales', role: ROLES.INGENIERO }
  );

  project = projectService.getProjectById('GC-Q-2026-000400');
  assert.equal(project.state, PROJECT_STATES.WARRANTY, 'Al resolverse todos los S1, debe retornar a WARRANTY');

  // 9. El cliente confirma: "Problema resuelto" y cierra formalmente
  const closeRes = ticketService.confirmTicketResolvedClient(tktRes1.ticketId, 'elena@omnicorp.com');
  assert.equal(closeRes.isClosed, true);

  const closedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(tktRes1.ticketId);
  assert.equal(closedTicket.internal_status, 'CLOSED');
});
