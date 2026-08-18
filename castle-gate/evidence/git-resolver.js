/**
 * Castle Security & Quality Gate — Git Metadata & Tree Hash Resolver
 * 
 * Safely extracts deterministic repository identity, commit SHA, and tree hash.
 * Provides fallback to deterministic directory tree hashing when git CLI is unavailable.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

/**
 * Computes a deterministic tree hash over a directory's contents (excluding ignored dirs).
 * 
 * @param {string} dirPath 
 * @param {Set<string>} [ignoredDirs] 
 * @returns {string} SHA-256 tree hash
 */
function computeDirectoryTreeHash(dirPath, ignoredDirs = new Set(['node_modules', '.git', '.castle', 'dist', 'build'])) {
  const fileEntries = [];

  function traverse(current) {
    let items;
    try {
      items = fs.readdirSync(current, { withFileTypes: true });
    } catch (e) {
      return;
    }

    // Sort entries alphabetically for determinism
    items.sort((a, b) => a.name.localeCompare(b.name));

    for (const item of items) {
      const fullPath = path.join(current, item.name);
      if (item.isDirectory()) {
        if (!ignoredDirs.has(item.name)) {
          traverse(fullPath);
        }
      } else if (item.isFile()) {
        try {
          const content = fs.readFileSync(fullPath);
          const relPath = path.relative(dirPath, fullPath).replace(/\\/g, '/');
          const fileSha = crypto.createHash('sha256').update(content).digest('hex');
          fileEntries.push(`${relPath}:${fileSha}`);
        } catch (e) {}
      }
    }
  }

  if (fs.existsSync(dirPath)) {
    traverse(dirPath);
  }

  const manifest = fileEntries.join('\n');
  return crypto.createHash('sha256').update(manifest, 'utf8').digest('hex');
}

/**
 * Resolves repository identity, commit SHA, and tree hash from working directory.
 * 
 * @param {string} targetDir 
 * @param {Object} [overrides] Explicit commit_sha, repo_url overrides
 * @returns {Object} Git provenance metadata
 */
function resolveGitProvenance(targetDir, overrides = {}) {
  let commitSha = overrides.commit_sha || null;
  let treeHash = overrides.git_tree_hash || null;
  let repoUrl = overrides.repository_url || null;
  let branch = null;
  let isDirty = false;

  const resolvedDir = path.resolve(targetDir || '.');

  // Try extracting via git CLI if available
  try {
    if (!commitSha) {
      commitSha = execSync('git rev-parse HEAD', { cwd: resolvedDir, stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 })
        .toString()
        .trim();
    }

    if (!treeHash) {
      treeHash = execSync('git rev-parse HEAD^{tree}', { cwd: resolvedDir, stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 })
        .toString()
        .trim();
    }

    if (!repoUrl) {
      try {
        repoUrl = execSync('git config --get remote.origin.url', { cwd: resolvedDir, stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 })
          .toString()
          .trim();
      } catch (e) {}
    }

    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: resolvedDir, stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 })
        .toString()
        .trim();
      const statusOutput = execSync('git status --porcelain', { cwd: resolvedDir, stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 })
        .toString()
        .trim();
      isDirty = statusOutput.length > 0;
    } catch (e) {}
  } catch (e) {
    // Git command failed or not a git repository
  }

  // Fallback: Compute deterministic tree hash from filesystem
  if (!treeHash) {
    treeHash = computeDirectoryTreeHash(resolvedDir);
  }

  if (!commitSha) {
    commitSha = `LOCAL-TREE-${treeHash.substring(0, 16)}`;
  }

  if (!repoUrl) {
    repoUrl = `local://${path.basename(resolvedDir)}`;
  }

  return {
    repository_url: repoUrl,
    repository_name: path.basename(resolvedDir),
    commit_sha: commitSha,
    git_tree_hash: treeHash,
    branch: branch || 'unknown',
    is_dirty: isDirty
  };
}

module.exports = {
  computeDirectoryTreeHash,
  resolveGitProvenance
};
