/**
 * Castle Security & Quality Gate — Security Guard & Resource Hardener
 * 
 * Protects Castle Gate against adversarial input, symlink jailbreaks, path traversal,
 * ReDoS attacks, memory exhaustion, and runaway scanning loops.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_RESOURCE_LIMITS = Object.freeze({
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,   // 5 MB per file (configurable)
  MAX_TOTAL_FILES: 5000,                  // 5000 files max per scan
  MAX_DIRECTORY_DEPTH: 20,                // 20 directory levels max
  SCANNER_TIMEOUT_MS: 30000,              // 30 seconds max per individual scanner
  GLOBAL_EVALUATION_TIMEOUT_MS: 60000,    // 60 seconds max for full multi-probe evaluation
  MAX_LINE_LENGTH_FOR_REGEX: 20000        // Prevent ReDoS on minified 1MB single-line files
});

/**
 * Validates that a file path resolves strictly within the allowed workspace boundary.
 * Resolves all symbolic links and relative traversal tokens (`..`).
 * 
 * @param {string} workspaceDir Base workspace directory path
 * @param {string} targetPath File or directory path to inspect
 * @returns {Object} { safe: boolean, realPath: string|null, reason: string|null }
 */
function validatePathWithinWorkspace(workspaceDir, targetPath) {
  try {
    const realWorkspace = fs.realpathSync(path.resolve(workspaceDir));
    const resolvedTarget = path.resolve(targetPath);

    // If file doesn't exist yet, check its directory
    let realTarget;
    if (fs.existsSync(resolvedTarget)) {
      realTarget = fs.realpathSync(resolvedTarget);
    } else {
      const parentDir = path.dirname(resolvedTarget);
      if (fs.existsSync(parentDir)) {
        const realParent = fs.realpathSync(parentDir);
        realTarget = path.join(realParent, path.basename(resolvedTarget));
      } else {
        realTarget = resolvedTarget;
      }
    }

    // Normalize separators for cross-platform comparison
    const normWorkspace = realWorkspace.replace(/\\/g, '/').toLowerCase();
    const normTarget = realTarget.replace(/\\/g, '/').toLowerCase();

    // Must be equal to workspace or start with workspace + '/'
    const isContained = normTarget === normWorkspace || normTarget.startsWith(normWorkspace.endsWith('/') ? normWorkspace : normWorkspace + '/');

    if (!isContained) {
      return {
        safe: false,
        realPath: realTarget,
        reason: `Path traversal or symlink escape detected: "${targetPath}" resolves to "${realTarget}" outside workspace "${realWorkspace}"`
      };
    }

    return {
      safe: true,
      realPath: realTarget,
      reason: null
    };
  } catch (err) {
    return {
      safe: false,
      realPath: null,
      reason: `Path resolution failed: ${err.message}`
    };
  }
}

/**
 * Traverses directory tree safely enforcing symlink isolation, depth caps, and file count limits.
 * 
 * @param {string} rootDir 
 * @param {Object} options { ignoredDirs, ignoredExtensions, allowedExtensions, maxFiles, maxDepth }
 * @returns {Object} { files: Array<string>, warnings: Array<string> }
 */
function safeDiscoverFiles(rootDir, options = {}) {
  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options };
  const maxFiles = options.maxFiles || limits.MAX_TOTAL_FILES;
  const maxDepth = options.maxDepth || limits.MAX_DIRECTORY_DEPTH;
  const ignoredDirs = options.ignoredDirs instanceof Set ? options.ignoredDirs : new Set(options.ignoredDirs || ['node_modules', '.git', '.castle', 'dist', 'build']);
  const ignoredExts = options.ignoredExtensions instanceof Set ? options.ignoredExtensions : new Set(options.ignoredExtensions || ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.zip', '.tar', '.gz', '.pdf']);
  const allowedExts = options.allowedExtensions ? (options.allowedExtensions instanceof Set ? options.allowedExtensions : new Set(options.allowedExtensions)) : null;

  const files = [];
  const warnings = [];

  let realWorkspace;
  try {
    realWorkspace = fs.realpathSync(path.resolve(rootDir));
  } catch (err) {
    warnings.push(`Cannot resolve root workspace: ${err.message}`);
    return { files: [], warnings };
  }

  function traverse(currentDir, currentDepth) {
    if (files.length >= maxFiles) {
      warnings.push(`Maximum file limit reached (${maxFiles} files). Scan truncated for DoS defense.`);
      return;
    }

    if (currentDepth > maxDepth) {
      warnings.push(`Maximum directory depth reached (${maxDepth} levels) at "${currentDir}". Subtree skipped.`);
      return;
    }

    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (err) {
      warnings.push(`Inaccessible directory: "${currentDir}" (${err.message})`);
      return;
    }

    // Sort deterministically
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (files.length >= maxFiles) break;

      const itemPath = path.join(currentDir, entry.name);

      // Check symlink containment
      if (entry.isSymbolicLink()) {
        const containment = validatePathWithinWorkspace(realWorkspace, itemPath);
        if (!containment.safe) {
          warnings.push(`Symlink traversal blocked: "${itemPath}" -> "${containment.realPath}"`);
          continue;
        }
      }

      let stat;
      try {
        stat = fs.statSync(itemPath);
      } catch (err) {
        continue;
      }

      if (stat.isDirectory()) {
        if (!ignoredDirs.has(entry.name) && !entry.name.startsWith('.test-scratch') && !entry.name.startsWith('.audit-scratch')) {
          traverse(itemPath, currentDepth + 1);
        }
      } else if (stat.isFile()) {
        if (stat.size > limits.MAX_FILE_SIZE_BYTES) {
          warnings.push(`File exceeds maximum size limit (${(stat.size / 1024 / 1024).toFixed(2)} MB > ${(limits.MAX_FILE_SIZE_BYTES / 1024 / 1024)} MB): "${itemPath}". Skipped.`);
          continue;
        }

        const ext = path.extname(entry.name).toLowerCase();
        const baseName = entry.name.toLowerCase();

        if (!ignoredExts.has(ext)) {
          if (!allowedExts ||
              allowedExts.has(ext) ||
              allowedExts.has(baseName) ||
              (baseName.startsWith('.env') && allowedExts.has('.env')) ||
              (baseName === '_headers' && (allowedExts.has('_headers') || allowedExts.has('.env') || allowedExts.has('.json')))) {
            files.push(itemPath);
          }
        }
      }
    }
  }

  traverse(realWorkspace, 0);

  return {
    files: files.sort(),
    warnings
  };
}

/**
 * Safely executes a regular expression over text, truncating oversized lines to prevent ReDoS.
 * 
 * @param {RegExp} regex 
 * @param {string} text 
 * @param {number} [maxLineLength=20000] 
 * @returns {boolean}
 */
function safeRegexTest(regex, text, maxLineLength = DEFAULT_RESOURCE_LIMITS.MAX_LINE_LENGTH_FOR_REGEX) {
  if (!text) return false;
  const safeText = text.length > maxLineLength ? text.substring(0, maxLineLength) : text;
  return regex.test(safeText);
}

module.exports = {
  DEFAULT_RESOURCE_LIMITS,
  validatePathWithinWorkspace,
  safeDiscoverFiles,
  safeRegexTest
};
