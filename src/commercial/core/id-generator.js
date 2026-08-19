/**
 * ============================================================================
 * GRUPO CASTILLO — GENERADOR Y VALIDADOR DE IDENTIFICADORES OFICIALES (v1.1)
 * ============================================================================
 * Genera y valida la taxonomía inmutable y única de identificadores:
 * - Cotizaciones / Proyectos: GC-Q-YYYY-XXXXXX (ej: GC-Q-2026-000042)
 * - Tickets de Soporte:       GC-T-YYYY-XXXXXX (ej: GC-T-2026-000001)
 * - Eventos de Auditoría:     GC-E-YYYY-XXXXXX
 */

import { randomInt } from 'node:crypto';

export const QUOTATION_ID_REGEX = /^GC-Q-\d{4}-\d{6}$/;
export const TICKET_ID_REGEX = /^GC-T-\d{4}-\d{6}$/;
export const AUDIT_EVENT_ID_REGEX = /^GC-E-\d{4}-\d{6}$/;

/**
 * Valida si una cadena cumple con el formato oficial de cotización/proyecto.
 * @param {string} id
 * @returns {boolean}
 */
export function isValidQuotationId(id) {
  return typeof id === 'string' && QUOTATION_ID_REGEX.test(id.trim());
}

/**
 * Valida si una cadena cumple con el formato oficial de ticket.
 * @param {string} id
 * @returns {boolean}
 */
export function isValidTicketId(id) {
  return typeof id === 'string' && TICKET_ID_REGEX.test(id.trim());
}

/**
 * Genera un nuevo identificador de cotización/proyecto.
 * @param {number} [sequenceNumber] - Número secuencial opcional. Si se omite, genera aleatorio de 6 dígitos.
 * @param {number} [year] - Año opcional. Por defecto el año UTC actual.
 * @returns {string}
 */
export function generateQuotationId(sequenceNumber, year = new Date().getUTCFullYear()) {
  const seq = typeof sequenceNumber === 'number' && sequenceNumber > 0
    ? String(sequenceNumber).padStart(6, '0')
    : String(randomInt(1, 999999)).padStart(6, '0');
  return `GC-Q-${year}-${seq}`;
}

/**
 * Genera un nuevo identificador de ticket.
 * @param {number} [sequenceNumber]
 * @param {number} [year]
 * @returns {string}
 */
export function generateTicketId(sequenceNumber, year = new Date().getUTCFullYear()) {
  const seq = typeof sequenceNumber === 'number' && sequenceNumber > 0
    ? String(sequenceNumber).padStart(6, '0')
    : String(randomInt(1, 999999)).padStart(6, '0');
  return `GC-T-${year}-${seq}`;
}

/**
 * Genera un identificador de evento de auditoría.
 * @param {number} [year]
 * @returns {string}
 */
export function generateAuditEventId(year = new Date().getUTCFullYear()) {
  const seq = String(randomInt(1, 999999)).padStart(6, '0');
  return `GC-E-${year}-${seq}`;
}
