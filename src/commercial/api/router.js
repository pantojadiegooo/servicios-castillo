/**
 * ============================================================================
 * GRUPO CASTILLO — ENRUTADOR HTTP DE LA API COMERCIAL (v1.1)
 * ============================================================================
 * Despacha todas las peticiones HTTP del Portal de Clientes, Panel Administrativo,
 * Panel de Ingeniería y Webhooks de Pasarelas de Pago.
 * Implementa CORS seguro, sesiones seguras en cookies HttpOnly y Bearer tokens,
 * control de acceso por roles (RBAC) y aislamiento multi-tenant a nivel de aplicación.
 */

import { ROLES } from '../core/roles.js';

export class CommercialApiRouter {
  /**
   * @param {object} services
   * @param {import('../services/auth.service.js').AuthService} services.authService
   * @param {import('../services/quotation.service.js').QuotationService} services.quotationService
   * @param {import('../services/contract.service.js').ContractService} services.contractService
   * @param {import('../services/project.service.js').ProjectService} services.projectService
   * @param {import('../services/payment.service.js').PaymentService} services.paymentService
   * @param {import('../services/predelivery.service.js').PreDeliveryService} services.preDeliveryService
   * @param {import('../services/delivery.service.js').DeliveryService} services.deliveryService
   * @param {import('../services/ticket.service.js').TicketService} services.ticketService
   * @param {import('../services/document.service.js').DocumentService} services.documentService
   * @param {import('../services/audit.service.js').AuditService} services.auditService
   */
  constructor(services) {
    this.authService = services.authService;
    this.quotationService = services.quotationService;
    this.contractService = services.contractService;
    this.projectService = services.projectService;
    this.paymentService = services.paymentService;
    this.preDeliveryService = services.preDeliveryService;
    this.deliveryService = services.deliveryService;
    this.ticketService = services.ticketService;
    this.documentService = services.documentService;
    this.auditService = services.auditService;
  }

  /**
   * Extrae el token de sesión de la cabecera Cookie o Authorization.
   * @param {import('node:http').IncomingMessage} req
   * @returns {string|null}
   */
  extractSessionToken(req) {
    // 1. Intentar desde cabecera Authorization (Bearer <token>)
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    // 2. Intentar desde Cookie HttpOnly (gc_session=<token>)
    const cookieHeader = req.headers['cookie'] || '';
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)gc_session=([^;]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1].trim());
      }
    }

    return null;
  }

  /**
   * Manejador central de peticiones HTTP.
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @param {string} rawBody
   */
  async handleRequest(req, res, rawBody = '') {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = (req.method || 'GET').toUpperCase();
    const actorIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    // Headers CORS y Seguridad
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature, x-signature, x-request-id');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    let body = {};
    if (rawBody && (req.headers['content-type'] || '').includes('application/json')) {
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        this.sendJson(res, 400, { error: 'Formato JSON inválido en el cuerpo de la petición' });
        return;
      }
    }

    // Extracción de contexto de sesión seguro
    const sessionToken = this.extractSessionToken(req);
    const session = sessionToken ? this.authService.validateSession(sessionToken) : null;

    try {
      // ----------------------------------------------------------------------
      // 1. RUTAS DE AUTENTICACIÓN
      // ----------------------------------------------------------------------
      if (pathname === '/api/auth/otp' && method === 'POST') {
        const result = this.authService.requestOtp(body.email, body.projectId, actorIp);
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname === '/api/auth/verify' && method === 'POST') {
        const result = this.authService.verifyOtp(body.email, body.otp, actorIp);

        // Fijar cookie HttpOnly para máxima seguridad en navegadores
        res.setHeader('Set-Cookie', `gc_session=${result.sessionToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname === '/api/auth/logout' && method === 'POST') {
        if (sessionToken) {
          this.authService.revokeSession(sessionToken);
        }
        res.setHeader('Set-Cookie', 'gc_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
        this.sendJson(res, 200, { success: true, message: 'Sesión finalizada exitosamente' });
        return;
      }

      if (pathname === '/api/auth/me' && method === 'GET') {
        if (!session) return this.sendJson(res, 401, { error: 'No autenticado' });
        this.sendJson(res, 200, { user: session });
        return;
      }

      // ----------------------------------------------------------------------
      // 2. WEBHOOKS DE PASARELAS DE PAGO (Públicos con validación criptográfica)
      // ----------------------------------------------------------------------
      if (pathname === '/api/webhooks/stripe' && method === 'POST') {
        const signature = req.headers['stripe-signature'];
        const result = this.paymentService.processStripeWebhook(body, rawBody, signature);
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname === '/api/webhooks/mercadopago' && method === 'POST') {
        const xSignature = req.headers['x-signature'];
        const xRequestId = req.headers['x-request-id'];
        const dataId = body.data?.id || body.id || parsedUrl.searchParams.get('data.id') || parsedUrl.searchParams.get('id');

        const result = this.paymentService.processMercadoPagoWebhook({
          payload: body,
          dataId: String(dataId || ''),
          xRequestId: String(xRequestId || ''),
          xSignatureHeader: String(xSignature || '')
        });
        this.sendJson(res, 200, result);
        return;
      }

      // ----------------------------------------------------------------------
      // 3. RUTAS DE COTIZACIONES Y CONTRATOS
      // ----------------------------------------------------------------------
      if (pathname === '/api/quotations' && method === 'POST') {
        // Solo Administración puede emitir cotizaciones
        if (!session || session.role !== ROLES.ADMINISTRACION) {
          return this.sendJson(res, 403, { error: 'Solo Administración puede emitir cotizaciones oficiales' });
        }
        const result = this.quotationService.createQuotation({
          ...body,
          createdBy: session.userId,
          actorIp
        });
        this.sendJson(res, 201, result);
        return;
      }

      if (pathname.startsWith('/api/quotations/') && method === 'GET') {
        const projectId = pathname.replace('/api/quotations/', '').split('/')[0];
        const quotation = this.quotationService.getLatestQuotation(projectId);
        if (!quotation) return this.sendJson(res, 404, { error: 'Cotización no encontrada' });
        this.sendJson(res, 200, { quotation });
        return;
      }

      if (pathname.match(/^\/api\/quotations\/([^/]+)\/accept$/) && method === 'POST') {
        const projectId = pathname.split('/')[3];
        const result = this.quotationService.acceptQuotation(projectId, {
          acceptedByName: body.acceptedByName,
          acceptedByEmail: body.acceptedByEmail,
          acceptedIpAddress: actorIp
        });
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname.match(/^\/api\/contracts\/([^/]+)\/sign$/) && method === 'POST') {
        const projectId = pathname.split('/')[3];
        const result = this.contractService.signContract(projectId, {
          signerName: body.signerName,
          signerTitle: body.signerTitle,
          signerRfc: body.signerRfc,
          signerIp: actorIp
        });
        this.sendJson(res, 200, result);
        return;
      }

      // ----------------------------------------------------------------------
      // 4. RUTAS DE PROYECTOS Y EXPEDIENTES (Application-Level Tenant Isolation)
      // ----------------------------------------------------------------------
      if (pathname.match(/^\/api\/projects\/([^/]+)$/) && method === 'GET') {
        const projectId = pathname.split('/')[3];
        if (!session) return this.sendJson(res, 401, { error: 'Se requiere autenticación' });
        this.authService.enforceProjectIsolation(session, projectId);

        const project = this.projectService.getProjectById(projectId);
        if (!project) return this.sendJson(res, 404, { error: 'Proyecto no encontrado' });

        this.sendJson(res, 200, { project });
        return;
      }

      if (pathname.match(/^\/api\/projects\/([^/]+)\/activate$/) && method === 'POST') {
        const projectId = pathname.split('/')[3];
        if (!session || session.role !== ROLES.ADMINISTRACION) {
          return this.sendJson(res, 403, { error: 'Solo Administración puede autorizar la activación del proyecto' });
        }
        const result = this.projectService.activateProject(
          projectId,
          session.userId,
          body.engineerId,
          body.targetDeliveryDate,
          actorIp
        );
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname.match(/^\/api\/projects\/([^/]+)\/assign-engineer$/) && method === 'POST') {
        const projectId = pathname.split('/')[3];
        if (!session || session.role !== ROLES.ADMINISTRACION) {
          return this.sendJson(res, 403, { error: 'Solo Administración puede asignar ingenieros' });
        }
        const result = this.projectService.assignEngineer(projectId, body.engineerId, session.userId, actorIp);
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname.match(/^\/api\/projects\/([^/]+)\/transition$/) && method === 'POST') {
        const projectId = pathname.split('/')[3];
        if (!session) return this.sendJson(res, 401, { error: 'Se requiere autenticación' });
        this.authService.enforceProjectIsolation(session, projectId);

        const result = this.projectService.transitionState(
          projectId,
          body.toState,
          { userId: session.userId, role: session.role, ip: actorIp },
          body.rationale
        );
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname.match(/^\/api\/projects\/([^/]+)\/milestones\/([^/]+)$/) && method === 'POST') {
        const milestoneId = pathname.split('/')[5];
        if (!session || (session.role !== ROLES.INGENIERO && session.role !== ROLES.ADMINISTRACION)) {
          return this.sendJson(res, 403, { error: 'Solo ingenieros asignados o administración pueden actualizar hitos' });
        }
        const result = this.projectService.updateMilestone(
          milestoneId,
          body.status,
          body.evidenceUrl,
          { userId: session.userId, role: session.role, ip: actorIp }
        );
        this.sendJson(res, 200, result);
        return;
      }

      // ----------------------------------------------------------------------
      // 5. RUTAS DE PREENTREGA Y ENTREGA
      // ----------------------------------------------------------------------
      if (pathname === '/api/predelivery/publish' && method === 'POST') {
        if (!session || (session.role !== ROLES.INGENIERO && session.role !== ROLES.ADMINISTRACION)) {
          return this.sendJson(res, 403, { error: 'No autorizado para publicar preentrega' });
        }
        const result = this.preDeliveryService.publishPreDelivery({
          projectId: body.projectId,
          stagingUrl: body.stagingUrl,
          castleGateValidationId: body.castleGateValidationId,
          castleGateScore: body.castleGateScore,
          castleGateCert: body.castleGateCert,
          actorId: session.userId,
          actorRole: session.role,
          actorIp
        });
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname.match(/^\/api\/predelivery\/([^/]+)\/authorize$/) && method === 'POST') {
        const projectId = pathname.split('/')[3];
        if (!session || session.role !== ROLES.ADMINISTRACION) {
          return this.sendJson(res, 403, { error: 'Solo Administración puede autorizar la preentrega' });
        }
        const result = this.preDeliveryService.authorizePreDelivery(projectId, session.userId, actorIp);
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname.match(/^\/api\/predelivery\/([^/]+)\/approve$/) && method === 'POST') {
        const projectId = pathname.split('/')[3];
        if (!session || session.role !== ROLES.CLIENTE) {
          return this.sendJson(res, 403, { error: 'Solo el cliente puede aprobar la preentrega' });
        }
        this.authService.enforceProjectIsolation(session, projectId);
        const result = this.preDeliveryService.approvePreDelivery(projectId, session.email, actorIp);
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname.match(/^\/api\/predelivery\/([^/]+)\/observations$/) && method === 'POST') {
        const projectId = pathname.split('/')[3];
        if (!session || session.role !== ROLES.CLIENTE) {
          return this.sendJson(res, 403, { error: 'Solo el cliente puede reportar observaciones de preentrega' });
        }
        this.authService.enforceProjectIsolation(session, projectId);
        const result = this.preDeliveryService.reportObservations(
          projectId,
          body.notes,
          body.evidenceUrls,
          session.email,
          actorIp
        );
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname.match(/^\/api\/delivery\/([^/]+)\/authorize$/) && method === 'POST') {
        const projectId = pathname.split('/')[3];
        if (!session || session.role !== ROLES.ADMINISTRACION) {
          return this.sendJson(res, 403, { error: 'Solo Administración puede autorizar la entrega final' });
        }
        const result = this.deliveryService.authorizeDelivery(projectId, session.userId, actorIp);
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname.match(/^\/api\/delivery\/([^/]+)\/confirm$/) && method === 'POST') {
        const projectId = pathname.split('/')[3];
        if (!session || session.role !== ROLES.CLIENTE) {
          return this.sendJson(res, 403, { error: 'Solo el cliente puede confirmar recepción del handoff' });
        }
        this.authService.enforceProjectIsolation(session, projectId);
        const result = this.deliveryService.confirmReceiptAndStartWarranty(projectId, session.email, actorIp);
        this.sendJson(res, 200, result);
        return;
      }

      // ----------------------------------------------------------------------
      // 6. RUTAS FINANCIERAS Y PAGOS
      // ----------------------------------------------------------------------
      if (pathname.match(/^\/api\/payments\/([^/]+)\/receipt$/) && method === 'POST') {
        const paymentId = pathname.split('/')[3];
        if (!session || session.role !== ROLES.CLIENTE) {
          return this.sendJson(res, 403, { error: 'Solo el cliente puede adjuntar comprobantes de pago' });
        }
        const result = this.paymentService.submitBankTransferReceipt(paymentId, body.comprobanteUrl, session.email, actorIp);
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname.match(/^\/api\/payments\/([^/]+)\/verify$/) && method === 'POST') {
        const paymentId = pathname.split('/')[3];
        if (!session || session.role !== ROLES.ADMINISTRACION) {
          return this.sendJson(res, 403, { error: 'Solo Administración puede conciliar pagos manualmente' });
        }
        const result = this.paymentService.verifyPaymentManual(paymentId, session.userId, actorIp);
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname.match(/^\/api\/projects\/([^/]+)\/financials$/) && method === 'GET') {
        const projectId = pathname.split('/')[3];
        if (!session) return this.sendJson(res, 401, { error: 'Se requiere autenticación' });
        this.authService.enforceProjectIsolation(session, projectId);
        const summary = this.paymentService.getProjectFinancialSummary(projectId);
        this.sendJson(res, 200, { summary });
        return;
      }

      // ----------------------------------------------------------------------
      // 7. RUTAS DE TICKETS Y SOPORTE
      // ----------------------------------------------------------------------
      if (pathname.match(/^\/api\/projects\/([^/]+)\/tickets$/) && method === 'GET') {
        const projectId = pathname.split('/')[3];
        if (!session) return this.sendJson(res, 401, { error: 'Se requiere autenticación' });
        this.authService.enforceProjectIsolation(session, projectId);
        const tickets = this.ticketService.getProjectTickets(projectId, session.role);
        this.sendJson(res, 200, { tickets });
        return;
      }

      if (pathname.match(/^\/api\/projects\/([^/]+)\/tickets$/) && method === 'POST') {
        const projectId = pathname.split('/')[3];
        if (!session) return this.sendJson(res, 401, { error: 'Se requiere autenticación' });
        this.authService.enforceProjectIsolation(session, projectId);
        const result = this.ticketService.createTicket({
          projectId,
          title: body.title,
          description: body.description,
          severity: body.severity,
          evidenceUrls: body.evidenceUrls,
          actor: { userId: session.userId, name: session.email, role: session.role, ip: actorIp }
        });
        this.sendJson(res, 201, result);
        return;
      }

      if (pathname.match(/^\/api\/tickets\/([^/]+)\/messages$/) && method === 'POST') {
        const ticketId = pathname.split('/')[3];
        if (!session) return this.sendJson(res, 401, { error: 'Se requiere autenticación' });
        const result = this.ticketService.addMessage(
          ticketId,
          body.message,
          body.evidenceUrls,
          body.isInternalNote && session.role !== ROLES.CLIENTE,
          { userId: session.userId, name: session.email, role: session.role, ip: actorIp }
        );
        this.sendJson(res, 201, result);
        return;
      }

      if (pathname.match(/^\/api\/tickets\/([^/]+)\/resolve$/) && method === 'POST') {
        const ticketId = pathname.split('/')[3];
        if (!session || (session.role !== ROLES.INGENIERO && session.role !== ROLES.ADMINISTRACION)) {
          return this.sendJson(res, 403, { error: 'Solo ingenieros o administración pueden resolver técnicamente un ticket' });
        }
        const result = this.ticketService.resolveTicketInternal(
          ticketId,
          body.resolutionNotes || 'Problema corregido en entorno correspondiente.',
          { userId: session.userId, name: session.email, role: session.role, ip: actorIp }
        );
        this.sendJson(res, 200, result);
        return;
      }

      if (pathname.match(/^\/api\/tickets\/([^/]+)\/confirm-resolved$/) && method === 'POST') {
        const ticketId = pathname.split('/')[3];
        if (!session || session.role !== ROLES.CLIENTE) {
          return this.sendJson(res, 403, { error: 'Solo el cliente puede confirmar el cierre definitivo del ticket' });
        }
        const result = this.ticketService.confirmTicketResolvedClient(ticketId, session.email, actorIp);
        this.sendJson(res, 200, result);
        return;
      }

      // ----------------------------------------------------------------------
      // 8. RUTAS DE DASHBOARDS (ADMIN & INGENIERÍA)
      // ----------------------------------------------------------------------
      if (pathname === '/api/admin/dashboard' && method === 'GET') {
        if (!session || session.role !== ROLES.ADMINISTRACION) {
          return this.sendJson(res, 403, { error: 'Acceso restringido a Dirección y Administración' });
        }
        const projects = this.projectService.db.prepare(`
          SELECT p.*, c.business_name, c.contact_name, c.contact_email,
                 u.name as engineer_name, u.last_name as engineer_last_name
          FROM projects p
          JOIN clients c ON p.client_id = c.id
          LEFT JOIN internal_users u ON p.assigned_engineer_id = u.id
          ORDER BY p.created_at DESC
        `).all();

        const pendingPayments = this.paymentService.db.prepare(`
          SELECT pay.*, p.name as project_name, c.business_name
          FROM payments pay
          JOIN projects p ON pay.project_id = p.id
          JOIN clients c ON p.client_id = c.id
          WHERE pay.status IN ('PENDING', 'PENDING_VERIFICATION')
          ORDER BY pay.created_at ASC
        `).all();

        const openTickets = this.ticketService.db.prepare(`
          SELECT t.*, p.name as project_name
          FROM tickets t
          JOIN projects p ON t.project_id = p.id
          WHERE t.internal_status != 'CLOSED'
          ORDER BY t.created_at DESC
        `).all();

        const recentAudit = this.auditService.getGlobalAuditTrail(20);

        this.sendJson(res, 200, {
          metrics: {
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.state === 'ACTIVE' || p.state === 'PLANNING' || p.state === 'DEVELOPMENT' || p.state === 'QA').length,
            frozenProjects: projects.filter(p => p.state === 'PROJECT_FROZEN').length,
            pendingPaymentsCount: pendingPayments.length,
            openTicketsCount: openTickets.length
          },
          projects,
          pendingPayments,
          openTickets,
          recentAudit
        });
        return;
      }

      if (pathname === '/api/engineer/dashboard' && method === 'GET') {
        if (!session || (session.role !== ROLES.INGENIERO && session.role !== ROLES.ADMINISTRACION)) {
          return this.sendJson(res, 403, { error: 'Acceso restringido a equipo de ingeniería' });
        }
        const assignedProjects = this.projectService.db.prepare(`
          SELECT p.*, c.business_name, c.contact_name, c.contact_email
          FROM projects p
          JOIN clients c ON p.client_id = c.id
          WHERE p.assigned_engineer_id = ?
          ORDER BY p.updated_at DESC
        `).all(session.userId);

        const assignedTickets = this.ticketService.db.prepare(`
          SELECT t.*, p.name as project_name
          FROM tickets t
          JOIN projects p ON t.project_id = p.id
          WHERE t.assigned_engineer_id = ? AND t.internal_status != 'CLOSED'
          ORDER BY t.created_at DESC
        `).all(session.userId);

        this.sendJson(res, 200, {
          assignedProjects,
          assignedTickets
        });
        return;
      }

      // Ruta no encontrada
      this.sendJson(res, 404, { error: `Ruta de API no encontrada: ${method} ${pathname}` });

    } catch (error) {
      console.error('Error en API Comercial:', error);
      this.sendJson(res, 400, { error: error.message || 'Error interno en el procesamiento' });
    }
  }

  /**
   * Helper para enviar respuestas JSON.
   * @param {import('node:http').ServerResponse} res
   * @param {number} statusCode
   * @param {object} data
   */
  sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
  }
}
