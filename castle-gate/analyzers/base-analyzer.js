/**
 * Castle Security & Quality Gate — Base Analyzer (Probe)
 * 
 * Abstract base class for all Castle Native Probes.
 * Provides standardized file system discovery, timing, safe file reading,
 * workspace jailbreak defense, resource limiting, and canonical RFC 8785 SHA-256 hashing.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { canonicalize } = require('../crypto/canonicalizer');
const { safeDiscoverFiles, validatePathWithinWorkspace, DEFAULT_RESOURCE_LIMITS } = require('./security-guard');

const DEFAULT_IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.castle',
  '.castle-remediation',
  'dist',
  'build',
  '.test-scratch',
  '.test-scratch-ops',
  '.test-scratch-adversarial',
  '.test-scratch-phase10',
  '.test-scratch-verifier',
  '.audit-scratch-phase8'
]);

const DEFAULT_IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.avif',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav',
  '.woff', '.woff2', '.ttf', '.eot',
  '.zip', '.tar', '.gz', '.pdf'
]);

class BaseAnalyzer {
  constructor(name, version) {
    if (new.target === BaseAnalyzer) {
      throw new TypeError('BaseAnalyzer is abstract and cannot be instantiated directly.');
    }
    this.name = name;
    this.version = version || '1.0.0';
  }

  /**
   * Discovers all readable source files in the target directory recursively,
   * strictly preventing symlink jailbreaks and path traversal.
   * 
   * @param {string} targetDir Target directory path
   * @param {Object} [options] Discovery options
   * @returns {Array<string>} Array of absolute file paths
   */
  discoverFiles(targetDir, options = {}) {
    const discoveryOptions = {
      ignoredDirs: options.ignoredDirs || DEFAULT_IGNORED_DIRS,
      ignoredExtensions: options.ignoredExtensions || DEFAULT_IGNORED_EXTENSIONS,
      allowedExtensions: options.allowedExtensions || null,
      maxFiles: options.maxFiles || DEFAULT_RESOURCE_LIMITS.MAX_TOTAL_FILES,
      maxDepth: options.maxDepth || DEFAULT_RESOURCE_LIMITS.MAX_DIRECTORY_DEPTH
    };

    const { files, warnings } = safeDiscoverFiles(targetDir, discoveryOptions);
    this._lastDiscoveryWarnings = warnings;
    return files;
  }

  /**
   * Safely reads a file with size cap (default: 5MB) and workspace boundary validation.
   * 
   * @param {string} filePath Absolute file path
   * @param {number} [maxBytes=5242880] Maximum allowed file size in bytes
   * @returns {string|null} File content string or null if unreadable/too large
   */
  safeReadFile(filePath, maxBytes = DEFAULT_RESOURCE_LIMITS.MAX_FILE_SIZE_BYTES) {
    try {
      if (!fs.existsSync(filePath)) return null;
      const stat = fs.statSync(filePath);
      if (stat.size > maxBytes) {
        return null; // Skip excessively large files to prevent DoS
      }
      return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      return null;
    }
  }

  /**
   * Wraps analyzer execution with duration calculation and canonical digest generation.
   * 
   * @param {string} targetDir
   * @param {Object} [options]
   * @returns {Object} Standardized probe result
   */
  run(targetDir, options = {}) {
    const startTime = Date.now();
    let probeResult = {
      probe_name: this.name,
      probe_version: this.version,
      scanned_files_count: 0,
      execution_duration_ms: 0,
      payload_sha256: null,
      controls: {},
      gate_evidence: {},
      errors: []
    };

    try {
      const customResults = this.analyze(targetDir, options);
      probeResult = {
        ...probeResult,
        ...customResults,
        probe_name: this.name,
        probe_version: this.version
      };
      if (this._lastDiscoveryWarnings && this._lastDiscoveryWarnings.length > 0) {
        probeResult.warnings = this._lastDiscoveryWarnings;
      }
    } catch (err) {
      probeResult.errors.push(`Probe execution failed: ${err.message}`);
    }

    probeResult.execution_duration_ms = Date.now() - startTime;

    // Calculate deterministic RFC 8785 SHA-256 over controls & gate_evidence
    const payloadForHashing = {
      probe_name: probeResult.probe_name,
      probe_version: probeResult.probe_version,
      controls: probeResult.controls,
      gate_evidence: probeResult.gate_evidence
    };
    const canonicalPayloadString = canonicalize(payloadForHashing);
    probeResult.payload_sha256 = crypto
      .createHash('sha256')
      .update(canonicalPayloadString, 'utf8')
      .digest('hex');

    return probeResult;
  }

  /**
   * Abstract analysis method. Must be overridden by subclasses.
   * 
   * @param {string} targetDir
   * @param {Object} options
   * @returns {Object}
   */
  analyze(targetDir, options) {
    throw new Error(`Analyze method not implemented in ${this.name}`);
  }
}

module.exports = {
  BaseAnalyzer,
  DEFAULT_IGNORED_DIRS,
  DEFAULT_IGNORED_EXTENSIONS
};
