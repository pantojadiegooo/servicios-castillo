/**
 * ============================================================================
 * GRUPO CASTILLO — SERVICIO DE AUTENTICACIÓN Y SEGURIDAD (v1.1)
 * ============================================================================
 * Implementa autenticación passwordless (OTP de 6 dígitos con validez de 10 min),
 * gestión de sesiones seguras mediante tokens criptográficos y cookies HttpOnly,
 * rate-limiting y aislamiento multi-tenant estricto a nivel de aplicación.
 */

import { randomInt, randomBytes, createHash } from 'node:crypto';
import { ROLES } from '../core/roles.js';

export class AuthService {
  /**
   * @param {import('node:sqlite').DatabaseSync} db
   * @param {import('./audit.service.js').AuditService} auditService
   */
  constructor(db, auditService) {
    this.db = db;
    this.auditService = auditService;
  }

  /**
   * Genera un hash SHA-256 seguro de un token o código numérico.
   * @param {string} token
   * @returns {string}
   */
  static hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Solicita un código OTP de acceso para un cliente o usuario interno.
   * @param {string} email
   * @param {string} [projectId]
   * @param {string} [actorIp]
   * @returns {{ success: boolean, message: string, debugOtp?: string }}
   */
  requestOtp(email, projectId = null, actorIp = null) {
    if (!email || typeof email !== 'string') {
      throw new Error('Correo electrónico obligatorio');
    }
    const cleanEmail = email.trim().toLowerCase();

    // Si viene projectId, validar que el proyecto exista y corresponda al email
    if (projectId) {
      const projStmt = this.db.prepare(`
        SELECT p.id, c.contact_email
        FROM projects p
        JOIN clients c ON p.client_id = c.id
        WHERE p.id = ?
      `);
      const project = projStmt.get(projectId);
      if (!project) {
        throw new Error('El identificador de proyecto especificado no existe.');
      }
      if (project.contact_email.toLowerCase() !== cleanEmail) {
        throw new Error('El correo no coincide con el contacto oficial registrado en el proyecto.');
      }
    }

    // Rate-limiting: verificar intentos en los últimos 5 minutos
    const recentStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM otp_tokens
      WHERE email = ? AND created_at > datetime('now', '-5 minutes')
    `);
    const recent = recentStmt.get(cleanEmail);
    if (recent && recent.count >= 5) {
      throw new Error('Límite de solicitudes excedido. Por favor espera 5 minutos.');
    }

    // Invalidar OTPs anteriores no utilizados
    this.db.prepare(`
      UPDATE otp_tokens SET is_used = 1
      WHERE email = ? AND is_used = 0
    `).run(cleanEmail);

    // Generar código numérico de 6 dígitos
    const plainOtp = String(randomInt(100000, 999999));
    const hashedOtp = AuthService.hashToken(plainOtp);
    const otpId = `otp_${randomBytes(8).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos

    this.db.prepare(`
      INSERT INTO otp_tokens (id, email, project_id, hashed_token, attempts_count, max_attempts, expires_at, is_used)
      VALUES (?, ?, ?, ?, 0, 3, ?, 0)
    `).run(otpId, cleanEmail, projectId, hashedOtp, expiresAt);

    this.auditService.logEvent({
      projectId,
      actorId: cleanEmail,
      actorRole: 'ANONYMOUS',
      actorIp,
      action: 'OTP_REQUESTED',
      rationale: `Solicitud de código de verificación OTP para ${cleanEmail}`
    });

    return {
      success: true,
      message: 'Código de acceso seguro enviado. Válido por 10 minutos.',
      debugOtp: process.env.NODE_ENV !== 'production' ? plainOtp : undefined
    };
  }

  /**
   * Verifica el código OTP y crea una sesión activa.
   * @param {string} email
   * @param {string} plainOtp
   * @param {string} [actorIp]
   * @returns {{ success: boolean, sessionToken: string, user: object }}
   */
  verifyOtp(email, plainOtp, actorIp = null) {
    if (!email || !plainOtp) {
      throw new Error('Email y código OTP son requeridos');
    }
    const cleanEmail = email.trim().toLowerCase();
    const hashedAttempt = AuthService.hashToken(plainOtp.trim());

    const otpStmt = this.db.prepare(`
      SELECT * FROM otp_tokens
      WHERE email = ? AND is_used = 0 AND datetime(expires_at) > datetime('now')
      ORDER BY created_at DESC LIMIT 1
    `);
    const otpRecord = otpStmt.get(cleanEmail);

    if (!otpRecord) {
      throw new Error('Código OTP no encontrado, expirado o ya utilizado.');
    }

    if (otpRecord.attempts_count >= otpRecord.max_attempts) {
      this.db.prepare('UPDATE otp_tokens SET is_used = 1 WHERE id = ?').run(otpRecord.id);
      throw new Error('Número máximo de intentos excedido. Solicita un nuevo código.');
    }

    // Incrementar contador de intentos
    this.db.prepare('UPDATE otp_tokens SET attempts_count = attempts_count + 1 WHERE id = ?').run(otpRecord.id);

    if (otpRecord.hashed_token !== hashedAttempt) {
      throw new Error('Código de verificación incorrecto.');
    }

    // Marcar OTP como utilizado
    this.db.prepare('UPDATE otp_tokens SET is_used = 1 WHERE id = ?').run(otpRecord.id);

    // Determinar identidad del usuario (Cliente o Usuario Interno)
    let role = ROLES.CLIENTE;
    let userId = null;
    let userName = cleanEmail;
    let projectId = otpRecord.project_id;

    const internalStmt = this.db.prepare('SELECT * FROM internal_users WHERE email = ? AND is_active = 1');
    const internalUser = internalStmt.get(cleanEmail);

    if (internalUser) {
      role = internalUser.role;
      userId = internalUser.id;
      userName = `${internalUser.name} ${internalUser.last_name}`;
    } else {
      // Buscar cliente
      const clientStmt = this.db.prepare('SELECT * FROM clients WHERE contact_email = ?');
      const client = clientStmt.get(cleanEmail);
      if (client) {
        userId = client.id;
        userName = client.contact_name;
      } else {
        userId = `cli_${randomBytes(6).toString('hex')}`;
      }
    }

    // Crear sesión criptográfica
    const rawSessionToken = randomBytes(32).toString('hex');
    const sessionTokenHash = AuthService.hashToken(rawSessionToken);
    const sessionId = `ses_${randomBytes(8).toString('hex')}`;
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas

    this.db.prepare(`
      INSERT INTO sessions (id, user_id, role, project_id, email, session_token_hash, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, userId, role, projectId, cleanEmail, sessionTokenHash, sessionExpiresAt);

    this.auditService.logEvent({
      projectId,
      actorId: userId,
      actorRole: role,
      actorIp,
      action: 'LOGIN_SUCCESS',
      rationale: `Inicio de sesión exitoso mediante OTP para ${cleanEmail} con rol ${role}`
    });

    return {
      success: true,
      sessionToken: rawSessionToken,
      user: {
        userId,
        name: userName,
        email: cleanEmail,
        role,
        projectId
      }
    };
  }

  /**
   * Valida un token de sesión y devuelve el contexto del usuario autenticado.
   * @param {string} sessionToken
   * @returns {object|null}
   */
  validateSession(sessionToken) {
    if (!sessionToken || typeof sessionToken !== 'string') return null;
    const tokenHash = AuthService.hashToken(sessionToken.trim());

    const stmt = this.db.prepare(`
      SELECT * FROM sessions
      WHERE session_token_hash = ? AND datetime(expires_at) > datetime('now')
    `);
    const session = stmt.get(tokenHash);
    if (!session) return null;

    return {
      sessionId: session.id,
      userId: session.user_id,
      role: session.role,
      email: session.email,
      projectId: session.project_id
    };
  }

  /**
   * Cierra y revoca una sesión activa en la base de datos.
   * @param {string} sessionToken
   */
  revokeSession(sessionToken) {
    if (!sessionToken) return;
    const tokenHash = AuthService.hashToken(sessionToken.trim());
    this.db.prepare('DELETE FROM sessions WHERE session_token_hash = ?').run(tokenHash);
  }

  /**
   * Alias de compatibilidad para revocar sesión.
   * @param {string} sessionToken
   */
  logout(sessionToken) {
    this.revokeSession(sessionToken);
  }

  /**
   * Aislamiento Multi-Tenant a nivel de aplicación (Application-Level Tenant Isolation).
   * Lanza una excepción si un usuario no autorizado intenta acceder a un expediente ajeno.
   * @param {object} session
   * @param {string} projectId
   */
  enforceProjectIsolation(session, projectId) {
    if (!session) {
      throw new Error('No autenticado: Se requiere inicio de sesión');
    }

    if (session.role === ROLES.ADMINISTRACION) {
      return; // Administración ostenta acceso global para supervisión y gobernanza
    }

    const projStmt = this.db.prepare(`
      SELECT p.id, p.client_id, p.assigned_engineer_id, c.contact_email
      FROM projects p
      JOIN clients c ON p.client_id = c.id
      WHERE p.id = ?
    `);
    const project = projStmt.get(projectId);

    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    if (session.role === ROLES.INGENIERO) {
      if (project.assigned_engineer_id !== session.userId) {
        throw new Error('Acceso denegado: No eres el ingeniero asignado a este proyecto');
      }
      return;
    }

    if (session.role === ROLES.CLIENTE) {
      if (project.client_id !== session.userId && project.contact_email.toLowerCase() !== session.email.toLowerCase()) {
        throw new Error('Acceso denegado: Aislamiento de proyecto activo. No tienes autorización para ver este expediente.');
      }
      return;
    }

    throw new Error('Acceso no autorizado');
  }
}
