/**
 * Castle Security & Quality Gate — Configuration Loader
 * 
 * Discovers and parses workspace configuration files:
 * 1. Explicit path passed via --config <path>
 * 2. .castlegaterc.json in target directory or working directory
 * 3. .castlegaterc in target directory or working directory
 * 4. castle-gate.config.js in target directory or working directory
 * 
 * Provides safe defaults and validation.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
  project_name: null,
  default_level: 'C1',
  default_environment: 'production',
  output_directory: './.castle',
  ignored_directories: [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.castle'
  ],
  max_file_size_bytes: 5 * 1024 * 1024, // 5 MB
  probes: {
    security: { enabled: true },
    dom_semantics: { enabled: true },
    maintainability: { enabled: true }
  },
  generate_html_report: true,
  generate_json_artifacts: true
};

/**
 * Loads configuration for a given project directory
 * @param {string} targetDir Target directory to scan
 * @param {string} [explicitConfigPath] Optional explicit path to config file
 * @returns {Object} Merged configuration object
 */
function loadCastleGateConfig(targetDir, explicitConfigPath = null) {
  let loadedConfig = {};

  if (explicitConfigPath) {
    const resolvedPath = path.resolve(explicitConfigPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Specified configuration file does not exist: ${explicitConfigPath}`);
    }
    try {
      if (resolvedPath.endsWith('.js')) {
        loadedConfig = require(resolvedPath);
      } else {
        const raw = fs.readFileSync(resolvedPath, 'utf8');
        loadedConfig = JSON.parse(raw);
      }
    } catch (err) {
      throw new Error(`Failed to parse configuration file (${explicitConfigPath}): ${err.message}`);
    }
  } else {
    // Search candidates in targetDir then cwd
    const searchDirs = [path.resolve(targetDir), process.cwd()];
    const fileCandidates = ['.castlegaterc.json', '.castlegaterc', 'castle-gate.config.js'];

    for (const dir of searchDirs) {
      for (const candidate of fileCandidates) {
        const fullPath = path.join(dir, candidate);
        if (fs.existsSync(fullPath)) {
          try {
            if (candidate.endsWith('.js')) {
              loadedConfig = require(fullPath);
            } else {
              const raw = fs.readFileSync(fullPath, 'utf8');
              loadedConfig = JSON.parse(raw);
            }
            break;
          } catch (err) {
            // Ignore malformed auto-discovery and use defaults
          }
        }
      }
      if (Object.keys(loadedConfig).length > 0) break;
    }
  }

  // Merge with defaults
  return {
    ...DEFAULT_CONFIG,
    ...loadedConfig,
    probes: {
      ...DEFAULT_CONFIG.probes,
      ...(loadedConfig.probes || {})
    },
    ignored_directories: Array.from(new Set([
      ...DEFAULT_CONFIG.ignored_directories,
      ...(loadedConfig.ignored_directories || [])
    ]))
  };
}

module.exports = {
  DEFAULT_CONFIG,
  loadCastleGateConfig
};
