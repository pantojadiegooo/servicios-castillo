/**
 * ============================================================================
 * PRUEBA END-TO-END: CICLO DE VIDA COMPLETO DEL SISTEMA COMERCIAL (v1.1)
 * ============================================================================
 * Valida el flujo completo ordenado:
 * Lead → Cotización (GC-Q, 15d) → Aceptación → Contrato (MSA+SOW) → Pago Anticipo
 * → Regla NO START → ACTIVE → PLANNING → DEVELOPMENT → Hitos → QA
 * → PREDELIVERY (Staging + Castle Gate) → Aprobación Preentrega → BALANCE_PENDING
 * → Pago Finiquito → DELIVERY_READY → Entrega → WARRANTY (30d) → Incidente S1
 * → INCIDENT_OPEN → Resolución → Cierre por Cliente → WARRANTY → COMPLETED
 * → PORTAL_EXPIRED (Expediente y Auditoría preservados).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase } from '../../src/commercial/db/database.js';
import { AuditService } from '../../src/commercial/services/audit.service.js';
import { QuotationService } from '../../src/commercial/services/quotation.service.js';
import { ContractService } from '../../src/commercial/services/contract.service.js';
import { ProjectService } from '../../src/commercial/services/project.service.js';
import { PaymentService } from '../../src/commercial/services/payment.service.js';
import { PreDeliveryService } from '../../src/commercial/services/predelivery.service.js';
import { DeliveryService } from '../../src/commercial/services/delivery.service.js';
import { TicketService } from '../../src/commercial/services/ticket.service.js';
import { DocumentService } from '../../src/commercial/services/document.service.js';
import { PROJECT_STATES } from '../../src/commercial/core/state-machine.js';
import { MILESTONE_STATUS } from '../../src/commercial/core/progress-calculator.js';
import { ROLES } from '../../src/commercial/core/roles.js';

test('E2E Lifecycle — Flujo comercial integral de 21 estados', () => {
  const db = createDatabase(':memory:');
  const auditService = new AuditService(db);
  const quotationService = new QuotationService(db, auditService);
  const contractService = new ContractService(db, auditService);
  const projectService = new ProjectService(db, auditService);
  const paymentService = new PaymentService(db, auditService);
  const preDeliveryService = new PreDeliveryService(db, auditService, projectService);
  const deliveryService = new DeliveryService(db, auditService, projectService);
  const ticketService = new TicketService(db, auditService, projectService);
  const documentService = new DocumentService(db, auditService);

  // 1. LEAD & EMISIÓN DE COTIZACIÓN (GC-Q-YYYY-XXXXXX, DRAFT -> QUOTED, Vigencia 15 días)
  const quote = quotationService.createQuotation({
    businessName: 'Alpha Tech Group S.A.',
    contactName: 'Ing. Roberto Silva',
    contactEmail: 'roberto@alphatech.com',
    contactPhone: '+52 55 9876 5432',
    rfc_tax_id: 'ATG200101XYZ',
    serviceCode: 'GOLD', // Castle Gold $12,500 MXN
    projectName: 'Plataforma Corporativa Alpha',
    scopeDescription: 'Desarrollo integral de plataforma web corporativa con Astro SSG y Living Glass UI.',
    createdBy: 'usr_admin_01'
  });

  const projectId = quote.projectId;
  assert.ok(projectId.startsWith('GC-Q-2026-'));
  assert.equal(quote.state, PROJECT_STATES.QUOTED);
  assert.equal(quote.financial.subtotal, 12500);
  assert.equal(quote.financial.total, 14500);

  // 2. ACEPTACIÓN DE COTIZACIÓN POR EL CLIENTE (QUOTED -> ACCEPTED -> PAYMENT_PENDING)
  const acceptRes = quotationService.acceptQuotation(projectId, {
    acceptedByName: 'Roberto Silva',
    acceptedByEmail: 'roberto@alphatech.com',
    acceptedIpAddress: '201.140.30.15'
  });
  assert.equal(acceptRes.nextState, PROJECT_STATES.PAYMENT_PENDING);

  // 3. FORMALIZACIÓN DE CONTRATO (MSA GC-MSA-2026 + SOW)
  contractService.initializeContract(projectId);
  const signContractRes = contractService.signContract(projectId, {
    signerName: 'Roberto Silva',
    signerTitle: 'Director General',
    signerRfc: 'ATG200101XYZ',
    signerIp: '201.140.30.15'
  });
  assert.equal(signContractRes.success, true);
  assert.ok(signContractRes.contractHashSha256);

  // 4. PAGO DE ANTICIPO 50% ($7,250 MXN) Y VERIFICACIÓN ADMINISTRATIVA
  let project = projectService.getProjectById(projectId);
  const depositPayment = project.payments.find(p => p.concept === 'ANTICIPO_50');
  assert.ok(depositPayment);
  assert.equal(depositPayment.total_mxn, 7250);

  paymentService.submitBankTransferReceipt(depositPayment.id, 'https://vault.castillo.com/rec/spei_deposit.pdf', 'roberto@alphatech.com');
  paymentService.verifyPaymentManual(depositPayment.id, 'usr_admin_01');

  // 5. ACTIVACIÓN DEL PROYECTO CON REGLA NO START CLEARED (PAYMENT_PENDING -> ACTIVE)
  const activateRes = projectService.activateProject(
    projectId,
    'usr_admin_01',
    'usr_eng_01',
    '2026-09-30'
  );
  assert.equal(activateRes.state, PROJECT_STATES.ACTIVE);

  // 6. FASES DE INGENIERÍA: ACTIVE -> PLANNING -> DEVELOPMENT
  projectService.transitionState(
    projectId,
    PROJECT_STATES.PLANNING,
    { userId: 'usr_eng_01', role: ROLES.INGENIERO },
    'Iniciando definición de arquitectura y diseño Living Glass.'
  );

  projectService.transitionState(
    projectId,
    PROJECT_STATES.DEVELOPMENT,
    { userId: 'usr_eng_01', role: ROLES.INGENIERO },
    'Layout y tokens base aprobados. Iniciando construcción de componentes.'
  );

  // 7. AVANCE DE HITOS H1 Y H2 (PROGRESO DERIVADO = 60%)
  project = projectService.getProjectById(projectId);
  const h1 = project.milestones.find(m => m.code === 'H1');
  const h2 = project.milestones.find(m => m.code === 'H2');

  projectService.updateMilestone(h1.id, MILESTONE_STATUS.COMPLETED, 'https://github.com/castillo/alpha/commit/abc1', { userId: 'usr_eng_01', role: ROLES.INGENIERO });
  projectService.updateMilestone(h2.id, MILESTONE_STATUS.COMPLETED, 'https://staging-alpha.vercel.app', { userId: 'usr_eng_01', role: ROLES.INGENIERO });

  project = projectService.getProjectById(projectId);
  assert.equal(project.progress.progressPercentage, 60);

  // 8. QA Y CERTIFICACIÓN CASTLE GATE (DEVELOPMENT -> QA -> PREDELIVERY)
  const h3 = project.milestones.find(m => m.code === 'H3');
  const h4 = project.milestones.find(m => m.code === 'H4');
  projectService.updateMilestone(h3.id, MILESTONE_STATUS.COMPLETED, 'https://github.com/castillo/alpha/commit/abc3', { userId: 'usr_eng_01', role: ROLES.INGENIERO });
  projectService.updateMilestone(h4.id, MILESTONE_STATUS.VERIFIED, 'https://github.com/castillo/alpha/commit/abc4', { userId: 'usr_eng_01', role: ROLES.INGENIERO });

  projectService.transitionState(
    projectId,
    PROJECT_STATES.QA,
    { userId: 'usr_eng_01', role: ROLES.INGENIERO },
    'Ejecución de suite Castle Gate CQS v1.1.'
  );

  // 9. PUBLICACIÓN DE PREENTREGA EN STAGING (QA -> PREDELIVERY)
  const pdRes = preDeliveryService.publishPreDelivery({
    projectId,
    stagingUrl: 'https://staging-alpha.vercel.app',
    castleGateValidationId: 'CG-2026-CA45B1',
    castleGateScore: 100,
    castleGateCert: { validation_id: 'CG-2026-CA45B1', score: 100, status: 'PASS' },
    engineerId: 'usr_eng_01'
  });
  assert.equal(pdRes.state, PROJECT_STATES.PREDELIVERY);

  // 10. APROBACIÓN DE PREENTREGA POR EL CLIENTE (PREDELIVERY -> BALANCE_PENDING)
  const pdApproveRes = preDeliveryService.approvePreDelivery(projectId, 'roberto@alphatech.com');
  assert.equal(pdApproveRes.state, PROJECT_STATES.BALANCE_PENDING);

  // 11. LIQUIDACIÓN DEL 50% FINIQUITO ($7,250 MXN)
  project = projectService.getProjectById(projectId);
  const finiquitoPayment = project.payments.find(p => p.concept === 'FINIQUITO_50');
  assert.ok(finiquitoPayment);

  paymentService.submitBankTransferReceipt(finiquitoPayment.id, 'https://vault.castillo.com/rec/spei_finiquito.pdf', 'roberto@alphatech.com');
  paymentService.verifyPaymentManual(finiquitoPayment.id, 'usr_admin_01');

  const finSummary = paymentService.getProjectFinancialSummary(projectId);
  assert.equal(finSummary.isFullyPaid, true);
  assert.equal(finSummary.remainingBalance, 0);

  // 12. AUTORIZACIÓN DE ENTREGA (BALANCE_PENDING -> DELIVERY_READY)
  const delivAuthRes = deliveryService.authorizeDelivery(projectId, 'usr_admin_01');
  assert.equal(delivAuthRes.state, PROJECT_STATES.DELIVERY_READY);

  // 13. CLIENTE CONFIRMA RECEPCIÓN DEL HANDOFF Y ACTIVA GARANTÍA (DELIVERY_READY -> WARRANTY 30 Días)
  const confirmRecRes = deliveryService.confirmReceiptAndStartWarranty(projectId, 'roberto@alphatech.com');
  assert.equal(confirmRecRes.state, PROJECT_STATES.WARRANTY);
  assert.ok(confirmRecRes.warrantyEndDate);

  // 14. APERTURA DE TICKET CRÍTICO S1 (WARRANTY -> INCIDENT_OPEN)
  const tkt = ticketService.createTicket({
    projectId,
    title: 'Incidencia en pasarela de pago Vercel',
    description: 'No procesa webhooks correctamente.',
    severity: 'S1',
    actor: { userId: 'roberto@alphatech.com', name: 'Roberto Silva', role: ROLES.CLIENTE }
  });
  project = projectService.getProjectById(projectId);
  assert.equal(project.state, PROJECT_STATES.INCIDENT_OPEN);

  // 15. RESOLUCIÓN DE TICKET POR INGENIERÍA Y CIERRE CONFIRMADO POR EL CLIENTE (INCIDENT_OPEN -> WARRANTY)
  ticketService.resolveTicketInternal(tkt.ticketId, 'Webhook secret reconfigurado en dashboard.', { userId: 'usr_eng_01', name: 'Alejandro Morales', role: ROLES.INGENIERO });
  project = projectService.getProjectById(projectId);
  assert.equal(project.state, PROJECT_STATES.WARRANTY);

  ticketService.confirmTicketResolvedClient(tkt.ticketId, 'roberto@alphatech.com');

  // 16. COMPLETAR PROYECTO (WARRANTY -> COMPLETED -> PROGRAMAR PORTAL_EXPIRED T+15 Días)
  const completeRes = deliveryService.completeProject(projectId, 'usr_admin_01');
  assert.equal(completeRes.state, PROJECT_STATES.COMPLETED);
  assert.ok(completeRes.portalExpiresAt);

  // 17. VERIFICACIÓN DE EXPEDIENTE DOCUMENTAL Y BITÁCORA DE AUDITORÍA
  documentService.storeDocument({
    projectId,
    category: 'INGENIERIA_QA',
    title: 'Reporte de Cumplimiento Castle Gate CQS v1.1',
    filename: 'compliance-report.html',
    content: '<html><body>Compliance Report CQS PASS</body></html>',
    mimeType: 'text/html',
    actor: { userId: 'usr_eng_01', role: ROLES.INGENIERO }
  });

  const docs = documentService.getProjectDocuments(projectId);
  assert.equal(docs.length, 1);
  assert.equal(docs[0].category, 'INGENIERIA_QA');

  const auditTrail = auditService.getProjectAuditTrail(projectId);
  assert.ok(auditTrail.length >= 10, 'La bitácora de auditoría debe registrar todas las etapas del ciclo de vida');

  // Comprobar que no hay contraseñas o secretos en auditoría
  const auditString = JSON.stringify(auditTrail);
  assert.ok(!auditString.includes('"password"'));
  assert.ok(!auditString.includes('"otp"'));
  assert.ok(!auditString.includes('"secret"'));
});
