/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN: AUTENTICACIÓN OTP, SESIONES Y RBAC (v1.1)
 * ============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase } from '../../src/commercial/db/database.js';
import { AuditService } from '../../src/commercial/services/audit.service.js';
import { AuthService } from '../../src/commercial/services/auth.service.js';
import { ProjectService } from '../../src/commercial/services/project.service.js';
import { CommercialApiRouter } from '../../src/commercial/api/router.js';
import { ROLES, hasCapability, CAPABILITIES } from '../../src/commercial/core/roles.js';

test('Auth & RBAC — Flujo OTP passwordless y aislamiento de proyecto', async () => {
  const db = createDatabase(':memory:');
  const auditService = new AuditService(db);
  const authService = new AuthService(db, auditService);
  const projectService = new ProjectService(db, auditService);

  // 1. Crear cliente y proyecto de prueba
  db.prepare(`
    INSERT INTO clients (id, business_name, contact_name, contact_email)
    VALUES ('cli_test_1', 'Innova S.A.', 'Ana Martínez', 'ana@innova.com')
  `).run();

  db.prepare(`
    INSERT INTO projects (id, client_id, service_package_id, service_type, name, state)
    VALUES ('GC-Q-2026-000100', 'cli_test_1', 'gold', 'BUILD_PACKAGE', 'Portal Innova', 'QUOTED')
  `).run();

  // 2. Solicitar OTP
  const otpRes = authService.requestOtp('ana@innova.com', 'GC-Q-2026-000100');
  assert.equal(otpRes.success, true);
  assert.ok(otpRes.debugOtp, 'En modo dev/test debe retornar debugOtp para verificación');

  // 3. Verificar OTP incorrecto
  assert.throws(() => {
    authService.verifyOtp('ana@innova.com', '000000');
  }, /Código de verificación incorrecto/);

  // 4. Verificar OTP correcto
  const verifyRes = authService.verifyOtp('ana@innova.com', otpRes.debugOtp);
  assert.equal(verifyRes.success, true);
  assert.ok(verifyRes.sessionToken);
  assert.equal(verifyRes.user.role, ROLES.CLIENTE);
  assert.equal(verifyRes.user.email, 'ana@innova.com');

  // 5. Validar sesión
  const session = authService.validateSession(verifyRes.sessionToken);
  assert.ok(session);
  assert.equal(session.email, 'ana@innova.com');
  assert.equal(session.role, ROLES.CLIENTE);

  // 6. Validar Aislamiento a Nivel de Aplicación: Acceso permitido a su propio proyecto
  assert.doesNotThrow(() => {
    authService.enforceProjectIsolation(session, 'GC-Q-2026-000100');
  });

  // 7. Crear segundo cliente y proyecto
  db.prepare(`
    INSERT INTO clients (id, business_name, contact_name, contact_email)
    VALUES ('cli_test_2', 'Beta Corp', 'Carlos Díaz', 'carlos@beta.com')
  `).run();

  db.prepare(`
    INSERT INTO projects (id, client_id, service_package_id, service_type, name, state)
    VALUES ('GC-Q-2026-000200', 'cli_test_2', 'silver', 'BUILD_PACKAGE', 'Sitio Beta', 'QUOTED')
  `).run();

  // 8. Validar Aislamiento a Nivel de Aplicación: Acceso DENEGADO a proyecto ajeno
  assert.throws(() => {
    authService.enforceProjectIsolation(session, 'GC-Q-2026-000200');
  }, /Aislamiento de proyecto activo/);

  // 9. Administrador tiene acceso global
  const adminSession = { userId: 'usr_admin_01', role: ROLES.ADMINISTRACION, email: 'diego@grupocastillo.com' };
  assert.doesNotThrow(() => {
    authService.enforceProjectIsolation(adminSession, 'GC-Q-2026-000100');
    authService.enforceProjectIsolation(adminSession, 'GC-Q-2026-000200');
  });

  // 10. Matriz de capacidades RBAC
  assert.equal(hasCapability(ROLES.CLIENTE, CAPABILITIES.ACCEPT_QUOTATION), true);
  assert.equal(hasCapability(ROLES.CLIENTE, CAPABILITIES.AUTHORIZE_STATE_TRANSITION), false);
  assert.equal(hasCapability(ROLES.INGENIERO, CAPABILITIES.UPDATE_MILESTONE_PROGRESS), true);
  assert.equal(hasCapability(ROLES.INGENIERO, CAPABILITIES.VERIFY_PAYMENT_MANUAL), false);
  assert.equal(hasCapability(ROLES.ADMINISTRACION, CAPABILITIES.VERIFY_PAYMENT_MANUAL), true);
  assert.equal(hasCapability(ROLES.ADMINISTRACION, CAPABILITIES.AUTHORIZE_STATE_TRANSITION), true);

  // 11. Revocación de sesión
  authService.revokeSession(verifyRes.sessionToken);
  assert.equal(authService.validateSession(verifyRes.sessionToken), null, 'Token revocado debe retornar null');

  // 12. Token inválido
  assert.equal(authService.validateSession('token_totalmente_invalido'), null);

  // 13. Ingeniero no puede autorizar transiciones de estado directamente
  const engineerActor = { userId: 'usr_eng_01', role: ROLES.INGENIERO, ip: '127.0.0.1' };
  assert.throws(() => {
    projectService.transitionState('GC-Q-2026-000100', 'CANCELLED', engineerActor, 'Intento de cancelación por ingeniero');
  }, /El rol INGENIERO solo puede proponer/);

  // 14. Cliente no puede ejecutar transiciones administrativas
  const clientActor = { userId: 'cli_test_1', role: ROLES.CLIENTE, ip: '127.0.0.1' };
  assert.throws(() => {
    projectService.transitionState('GC-Q-2026-000100', 'CANCELLED', clientActor, 'Intento de cancelación por cliente');
  }, /El rol CLIENTE no tiene autorización/);

  // 15. Extracción de token de sesión vía Cookie HttpOnly en Router
  const router = new CommercialApiRouter({ authService, projectService });
  const mockReqBearer = { headers: { authorization: 'Bearer token_123' } };
  assert.equal(router.extractSessionToken(mockReqBearer), 'token_123');

  const mockReqCookie = { headers: { cookie: 'other=abc; gc_session=cookie_token_456; pref=dark' } };
  assert.equal(router.extractSessionToken(mockReqCookie), 'cookie_token_456');

  // 16. Health check responde 200 con status ok y database ok
  let healthStatusCode = 0;
  let healthBody = null;
  const mockHealthRes = {
    setHeader: () => {},
    writeHead: (code) => { healthStatusCode = code; },
    end: (data) => { healthBody = JSON.parse(data); }
  };
  await router.handleRequest({ url: '/health', method: 'GET', headers: {} }, mockHealthRes);
  assert.equal(healthStatusCode, 200);
  assert.equal(healthBody.status, 'ok');
  assert.equal(healthBody.database, 'ok');

  await router.handleRequest({ url: '/api/health', method: 'GET', headers: {} }, mockHealthRes);
  assert.equal(healthStatusCode, 200);
  assert.equal(healthBody.status, 'ok');
  assert.equal(healthBody.database, 'ok');
});
