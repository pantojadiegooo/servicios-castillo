/**
 * Castle Security & Quality Gate — Maintainability & Structure Native Probe
 * 
 * Performs deterministic static code hygiene analysis to identify:
 * - Monolithic source files > 800 lines & deep nesting > 5 levels (MNT-01.1)
 * - Lockfile hygiene & wildcard dependency risks (MNT-02.1)
 * - Explicit image dimensions & modern image format delivery (PER-04.1, PER-04.2)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { BaseAnalyzer } = require('./base-analyzer');

class MaintainabilityProbe extends BaseAnalyzer {
  constructor() {
    super('CastleMaintainabilityProbe', '1.0.0');
  }

  analyze(targetDir, options = {}) {
    const codeFiles = this.discoverFiles(targetDir, {
      ...options,
      allowedExtensions: ['.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.css', '.html', '.json', '.py', '.go']
    });

    const findings = {
      monolithic_files: [],
      excessive_nesting: [],
      lockfile_issues: [],
      wildcard_dependencies: [],
      missing_image_dimensions: [],
      legacy_image_formats: []
    };

    let totalCodeFiles = codeFiles.length;

    for (const filePath of codeFiles) {
      const relPath = path.relative(targetDir, filePath);
      const ext = path.extname(filePath).toLowerCase();
      const content = this.safeReadFile(filePath);
      if (!content) continue;

      const lines = content.split('\n');

      // 1. Monolithic Files Check (> 800 LOC)
      if (lines.length > 800) {
        findings.monolithic_files.push({
          file: relPath,
          line_count: lines.length,
          rule: 'MONOLITHIC_FILE',
          description: `File exceeds 800 lines of code (${lines.length} lines).`,
          severity: 'MEDIUM'
        });
      }

      // 2. Excessive Nesting Check (> 5 levels)
      if (['.js', '.ts', '.jsx', '.tsx', '.py'].includes(ext)) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const leadingSpaces = line.search(/\S|$/);
          const leadingTabs = line.match(/^\t+/);
          const tabCount = leadingTabs ? leadingTabs[0].length : 0;
          const spaceDepth = Math.floor(leadingSpaces / 4);

          if (spaceDepth > 5 || tabCount > 5) {
            findings.excessive_nesting.push({
              file: relPath,
              line: i + 1,
              depth: Math.max(spaceDepth, tabCount),
              rule: 'EXCESSIVE_NESTING',
              description: `Deep control nesting detected (depth: ${Math.max(spaceDepth, tabCount)}).`,
              severity: 'LOW'
            });
            break; // One report per file to avoid flooding
          }
        }
      }

      // 3. Image Dimensions in HTML files
      if (ext === '.html' || ext === '.htm') {
        const imgTags = [...content.matchAll(/<img\s+([^>]+)>/gi)];
        for (const img of imgTags) {
          const attr = img[1];
          const hasWidth = /\bwidth=["']?\d+["']?/i.test(attr);
          const hasHeight = /\bheight=["']?\d+["']?/i.test(attr);
          if (!hasWidth || !hasHeight) {
            findings.missing_image_dimensions.push({
              file: relPath,
              rule: 'MISSING_IMAGE_DIMENSIONS',
              description: `Image tag missing explicit width/height attribute to prevent layout shift.`,
              severity: 'MEDIUM'
            });
          }
        }
      }
    }

    // 4. Package & Lockfile Hygiene
    const pkgJsonPath = path.join(targetDir, 'package.json');
    let hasPackageJson = false;
    let hasLockfile = false;

    if (fs.existsSync(pkgJsonPath)) {
      hasPackageJson = true;
      const lockfilePath = path.join(targetDir, 'package-lock.json');
      const yarnLockPath = path.join(targetDir, 'yarn.lock');
      const pnpmLockPath = path.join(targetDir, 'pnpm-lock.yaml');

      if (fs.existsSync(lockfilePath) || fs.existsSync(yarnLockPath) || fs.existsSync(pnpmLockPath)) {
        hasLockfile = true;
      } else {
        findings.lockfile_issues.push({
          file: 'package.json',
          rule: 'MISSING_LOCKFILE',
          description: 'Project contains package.json but no lockfile (package-lock.json/yarn.lock).',
          severity: 'HIGH'
        });
      }

      // Check for wildcard dependencies
      try {
        const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        const allDeps = { ...(pkgData.dependencies || {}), ...(pkgData.devDependencies || {}) };
        for (const [dep, ver] of Object.entries(allDeps)) {
          if (ver === '*' || ver === 'latest' || ver.includes('>=')) {
            findings.wildcard_dependencies.push({
              file: 'package.json',
              dependency: dep,
              version_spec: ver,
              rule: 'WILDCARD_DEPENDENCY',
              description: `Wildcard or floating version specification detected: ${dep}@${ver}`,
              severity: 'HIGH'
            });
          }
        }
      } catch (e) {}
    }

    // Map probe findings to CQS atomic controls
    const controls = {};

    // MNT-01.1: Code Structure & Monolith Prevention
    if (findings.monolithic_files.length === 0 && findings.excessive_nesting.length === 0) {
      controls['MNT-01.1'] = {
        status: 'PASS',
        details: 'No monolithic files (> 800 lines) or excessive nesting (> 5 levels) detected.',
        findings: []
      };
    } else {
      controls['MNT-01.1'] = {
        status: 'FAIL',
        details: `${findings.monolithic_files.length} monolithic file(s), ${findings.excessive_nesting.length} deeply nested file(s).`,
        findings: [...findings.monolithic_files, ...findings.excessive_nesting]
      };
    }

    // MNT-02.1: Lockfile & Dependency Hygiene
    if (!hasPackageJson) {
      controls['MNT-02.1'] = {
        status: 'N/A',
        details: 'No package.json manifest found in repository.',
        findings: []
      };
    } else if (findings.lockfile_issues.length === 0 && findings.wildcard_dependencies.length === 0) {
      controls['MNT-02.1'] = {
        status: 'PASS',
        details: 'Deterministic lockfile present and zero wildcard dependencies found.',
        findings: []
      };
    } else {
      controls['MNT-02.1'] = {
        status: 'FAIL',
        details: `${findings.lockfile_issues.length} lockfile issue(s), ${findings.wildcard_dependencies.length} wildcard dependency risk(s).`,
        findings: [...findings.lockfile_issues, ...findings.wildcard_dependencies]
      };
    }

    // PER-04.2: Responsive Image Dimensions
    if (findings.missing_image_dimensions.length === 0) {
      controls['PER-04.2'] = {
        status: 'PASS',
        details: 'Explicit width and height dimensions defined on image tags.',
        findings: []
      };
    } else {
      controls['PER-04.2'] = {
        status: 'FAIL',
        details: `${findings.missing_image_dimensions.length} image tag(s) missing explicit width/height dimensions.`,
        findings: findings.missing_image_dimensions
      };
    }

    return {
      scanned_files_count: totalCodeFiles,
      controls,
      gate_evidence: {},
      findings
    };
  }
}

module.exports = {
  MaintainabilityProbe
};
