/**
 * Castle Security & Quality Gate — Remediation Store
 * 
 * Manages persistent storage and lifecycle tracking for Remediation Sessions.
 * Features:
 * - Append-only cycle logging
 * - JSON ledger persistence on filesystem
 * - Deadline calculation & SLA expiration detection
 * - State recovery across process restarts
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { RemediationSession } = require('./remediation-tracker');

class RemediationStore {
  constructor(storageDir) {
    this.storageDir = storageDir || path.join(__dirname, '..', '..', '.castle-remediation');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Generates file path for a session.
   */
  _getSessionPath(sessionId) {
    const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.storageDir, `${safeId}.json`);
  }

  /**
   * Persists a remediation session to disk.
   * 
   * @param {RemediationSession} session 
   * @returns {string} File path where session was saved
   */
  saveSession(session) {
    if (!session || typeof session.getHistory !== 'function') {
      throw new Error('[Remediation Store] Invalid session object passed to saveSession.');
    }

    const history = session.getHistory();
    const filePath = this._getSessionPath(history.session_id);
    
    // Add store metadata
    const record = {
      store_schema_version: '1.0.0',
      last_synced_at: new Date().toISOString(),
      session: history
    };

    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
    return filePath;
  }

  /**
   * Loads a remediation session from disk.
   * 
   * @param {string} sessionId 
   * @returns {RemediationSession|null}
   */
  loadSession(sessionId) {
    const filePath = this._getSessionPath(sessionId);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const sessData = data.session;

    const session = new RemediationSession(sessData.session_id, sessData.target_system, sessData.gate_level);
    session.created_at = sessData.created_at;
    session.is_closed = sessData.is_closed;
    session.cycles = [...sessData.cycles];

    return session;
  }

  /**
   * Lists all stored remediation sessions.
   * 
   * @returns {Array<Object>} List of session summaries
   */
  listSessions() {
    if (!fs.existsSync(this.storageDir)) {
      return [];
    }

    const files = fs.readdirSync(this.storageDir).filter(f => f.endsWith('.json'));
    const list = [];

    for (const f of files) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(this.storageDir, f), 'utf8'));
        if (content && content.session) {
          list.push({
            session_id: content.session.session_id,
            target_system: content.session.target_system,
            gate_level: content.session.gate_level,
            created_at: content.session.created_at,
            total_cycles: content.session.total_cycles,
            is_closed: content.session.is_closed,
            last_synced_at: content.last_synced_at
          });
        }
      } catch (err) {
        // Skip corrupted entries
      }
    }

    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  /**
   * Checks whether a remediation session has expired past its policy SLA deadline.
   * 
   * @param {RemediationSession} session 
   * @param {number} windowHours Policy remediation window in hours
   * @param {Date} [currentDate] Reference date (defaults to Date.now())
   * @returns {Object} { expired: boolean, deadline: string, remaining_hours: number }
   */
  checkExpiration(session, windowHours, currentDate = new Date()) {
    const history = session.getHistory();
    const createdTime = new Date(history.created_at).getTime();
    const windowMs = (windowHours || 168) * 60 * 60 * 1000;
    const deadlineTime = createdTime + windowMs;
    const deadlineStr = new Date(deadlineTime).toISOString();

    const nowTime = currentDate.getTime();
    const isExpired = !history.is_closed && nowTime > deadlineTime;
    const remainingMs = deadlineTime - nowTime;
    const remainingHours = Math.max(0, parseFloat((remainingMs / (1000 * 60 * 60)).toFixed(2)));

    return {
      expired: isExpired,
      deadline: deadlineStr,
      remaining_hours: isExpired ? 0 : remainingHours,
      session_closed: history.is_closed
    };
  }
}

module.exports = {
  RemediationStore
};
