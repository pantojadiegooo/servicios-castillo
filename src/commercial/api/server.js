/**
 * ============================================================================
 * GRUPO CASTILLO — SERVIDOR HTTP DEL SISTEMA COMERCIAL (v1.1)
 * ============================================================================
 * Levanta el servidor HTTP REST para el backend desacoplado del Sistema Comercial.
 * Soporta inyección de base de datos en memoria (para tests) o SQLite en disco.
 */

import { createServer } from 'node:http';
import { getDatabase } from '../db/database.js';
import { AuditService } from '../services/audit.service.js';
import { AuthService } from '../services/auth.service.js';
import { QuotationService } from '../services/quotation.service.js';
import { ContractService } from '../services/contract.service.js';
import { ProjectService } from '../services/project.service.js';
import { PaymentService } from '../services/payment.service.js';
import { PreDeliveryService } from '../services/predelivery.service.js';
import { DeliveryService } from '../services/delivery.service.js';
import { TicketService } from '../services/ticket.service.js';
import { DocumentService } from '../services/document.service.js';
import { CommercialApiRouter } from './router.js';

export function createCommercialServer(dbInstance = null, options = {}) {
  const db = dbInstance || getDatabase();

  const auditService = new AuditService(db);
  const authService = new AuthService(db, auditService);
  const quotationService = new QuotationService(db, auditService);
  const contractService = new ContractService(db, auditService);
  const projectService = new ProjectService(db, auditService);
  const paymentService = new PaymentService(db, auditService, options.paymentConfig || {});
  const preDeliveryService = new PreDeliveryService(db, auditService, projectService);
  const deliveryService = new DeliveryService(db, auditService, projectService);
  const ticketService = new TicketService(db, auditService, projectService);
  const documentService = new DocumentService(db, auditService, options.storageDir);

  const router = new CommercialApiRouter({
    authService,
    quotationService,
    contractService,
    projectService,
    paymentService,
    preDeliveryService,
    deliveryService,
    ticketService,
    documentService,
    auditService
  });

  const server = createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf-8');
      router.handleRequest(req, res, rawBody);
    });
  });

  return {
    server,
    router,
    services: {
      db,
      auditService,
      authService,
      quotationService,
      contractService,
      projectService,
      paymentService,
      preDeliveryService,
      deliveryService,
      ticketService,
      documentService
    }
  };
}

export function startCommercialServer(port = 4321, dbPath = undefined) {
  const { server } = createCommercialServer(dbPath ? getDatabase(dbPath) : undefined);
  server.listen(port, () => {
    console.log(`[Castillo Commercial API] Servidor activo en http://localhost:${port}`);
  });
  return server;
}
