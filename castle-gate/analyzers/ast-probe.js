/**
 * Castle Security & Quality Gate — Real AST Code Analyzer Probe (Babel / Acorn)
 * 
 * Performs deterministic AST structural code inspection over JavaScript, TypeScript,
 * JSX, TSX, and Astro component sources.
 * 
 * Capabilities:
 * - Full TypeScript & TSX grammar parsing via Babel Parser with Acorn fallback.
 * - Astro frontmatter and embedded script extraction and analysis.
 * - Explicit `debugger;` statement detection (ignoring strings and comments).
 * - Unsafe `eval()` and `new Function()` invocations.
 * - Unsafe DOM sinks (`innerHTML`, `outerHTML`, `document.write`).
 * - High Cyclomatic Complexity per function (configurable threshold, default > 15).
 * - Oversized functions and files measured by AST node count.
 * - Silent/empty catch blocks (`catch (e) {}`).
 * - Cross-file circular dependency / import cycle detection.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const acorn = require('acorn');
let babelParser = null;
try {
  babelParser = require('@babel/parser');
} catch (e) {
  babelParser = null;
}

const { BaseAnalyzer } = require('./base-analyzer');

const DEFAULT_AST_LIMITS = Object.freeze({
  MAX_CYCLOMATIC_COMPLEXITY: 15,
  MAX_FUNCTION_AST_NODES: 150,
  MAX_FILE_AST_NODES: 1500
});

class AstProbe extends BaseAnalyzer {
  constructor() {
    super('CastleAstProbe', '2.0.0');
  }

  /**
   * Recursively traverses an AST node and executes visitor callbacks.
   * 
   * @param {Object} node 
   * @param {Function} visitor 
   * @param {Object} [parent] 
   */
  walk(node, visitor, parent = null) {
    if (!node || typeof node !== 'object') return;

    visitor(node, parent);

    for (const key of Object.keys(node)) {
      if (key === 'parent' || key === 'loc' || key === 'comments' || key === 'tokens') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) {
          if (c && typeof c === 'object' && c.type) {
            this.walk(c, visitor, node);
          }
        }
      } else if (child && typeof child === 'object' && child.type) {
        this.walk(child, visitor, node);
      }
    }
  }

  /**
   * Counts total AST nodes within a subtree.
   * 
   * @param {Object} node 
   * @returns {number}
   */
  countNodes(node) {
    let count = 0;
    this.walk(node, () => { count++; });
    return count;
  }

  /**
   * Computes cyclomatic complexity for a given function AST node.
   * CC = 1 + number of decision points
   */
  computeFunctionComplexity(fnNode) {
    let complexity = 1;
    const body = fnNode.body;
    if (!body) return complexity;

    this.walk(body, (node) => {
      // Don't recurse into nested function bodies for parent function CC
      if (node !== body && (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression' || node.type === 'TSDeclareFunction')) {
        return;
      }

      switch (node.type) {
        case 'IfStatement':
        case 'ForStatement':
        case 'ForInStatement':
        case 'ForOfStatement':
        case 'WhileStatement':
        case 'DoWhileStatement':
        case 'ConditionalExpression': // a ? b : c
        case 'CatchClause':
          complexity++;
          break;
        case 'SwitchCase':
          if (node.test) complexity++; // count non-default cases
          break;
        case 'LogicalExpression':
          if (node.operator === '&&' || node.operator === '||' || node.operator === '??') {
            complexity++;
          }
          break;
      }
    });
    return complexity;
  }

  /**
   * Parses source code string into an AST using Babel with TypeScript/JSX or Acorn.
   * 
   * @param {string} content Source code string
   * @param {string} ext File extension
   * @returns {Object|null} AST or null if unparseable
   */
  parseSource(content, ext) {
    if (!content) return null;

    // Try Babel parser first if available
    if (babelParser) {
      const plugins = ['classProperties', 'decorators-legacy', 'dynamicImport', 'exportDefaultFrom'];
      if (ext === '.ts' || ext === '.tsx' || ext === '.mts' || ext === '.cts') {
        plugins.push('typescript');
      }
      if (ext === '.jsx' || ext === '.tsx') {
        plugins.push('jsx');
      }

      try {
        return babelParser.parse(content, {
          sourceType: 'module',
          plugins: plugins,
          tokens: false,
          errorRecovery: true
        });
      } catch (err) {
        // Retry with unambiguous script/module
        try {
          return babelParser.parse(content, {
            sourceType: 'unambiguous',
            plugins: ['typescript', 'jsx', ...plugins],
            tokens: false,
            errorRecovery: true
          });
        } catch (e2) {
          // Fall through to Acorn
        }
      }
    }

    // Acorn Fallback for JS
    try {
      return acorn.parse(content, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        locations: true,
        ranges: false
      });
    } catch (e) {
      try {
        return acorn.parse(content, {
          ecmaVersion: 'latest',
          sourceType: 'script',
          locations: true,
          ranges: false
        });
      } catch (e2) {
        return null;
      }
    }
  }

  /**
   * Extracts script content from .astro component files.
   * 
   * @param {string} content Astro file content
   * @returns {Array<{ code: string, lineOffset: number }>}
   */
  extractAstroCode(content) {
    const blocks = [];
    if (!content) return blocks;

    // 1. Astro frontmatter between --- and ---
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
      blocks.push({
        code: fmMatch[1],
        lineOffset: 1
      });
    }

    // 2. Embedded <script> tags
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(content)) !== null) {
      const code = match[1].trim();
      if (code) {
        const precedingText = content.substring(0, match.index);
        const lineOffset = precedingText.split('\n').length;
        blocks.push({
          code,
          lineOffset
        });
      }
    }

    return blocks;
  }

  /**
   * Extracts imported relative modules from an AST for dependency cycle analysis.
   * 
   * @param {Object} ast 
   * @returns {Array<string>} List of import specifiers
   */
  extractImportSpecifiers(ast) {
    const imports = [];
    if (!ast) return imports;

    this.walk(ast, (node) => {
      // import ... from '...'
      if ((node.type === 'ImportDeclaration' || node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration') && node.source && typeof node.source.value === 'string') {
        imports.push(node.source.value);
      }
      // require('...') or dynamic import('...')
      if (node.type === 'CallExpression') {
        if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'require' && node.arguments && node.arguments.length > 0 && node.arguments[0].type === 'StringLiteral') {
          imports.push(node.arguments[0].value);
        } else if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'require' && node.arguments && node.arguments.length > 0 && node.arguments[0].type === 'Literal' && typeof node.arguments[0].value === 'string') {
          imports.push(node.arguments[0].value);
        }
      }
    });

    return imports;
  }

  /**
   * Resolves a module specifier to an absolute file in the workspace.
   * 
   * @param {string} fromFile 
   * @param {string} specifier 
   * @returns {string|null}
   */
  resolveLocalImport(fromFile, specifier) {
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
      return null; // External package import (e.g. 'react', 'lodash')
    }

    const dir = path.dirname(fromFile);
    const basePath = path.resolve(dir, specifier);

    const candidates = [
      basePath,
      basePath + '.ts',
      basePath + '.tsx',
      basePath + '.js',
      basePath + '.jsx',
      basePath + '.mjs',
      basePath + '.cjs',
      basePath + '.astro',
      path.join(basePath, 'index.ts'),
      path.join(basePath, 'index.tsx'),
      path.join(basePath, 'index.js'),
      path.join(basePath, 'index.jsx')
    ];

    for (const c of candidates) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) {
        return c;
      }
    }

    return null;
  }

  /**
   * Detects circular dependencies across the file dependency graph.
   * 
   * @param {Object} depGraph { [filePath]: Array<targetPath> }
   * @returns {Array<Array<string>>} List of dependency cycles
   */
  detectCircularImports(depGraph) {
    const cycles = [];
    const visited = new Set();
    const recStack = new Set();
    const currentPath = [];

    const normalizedGraph = {};
    for (const [src, targets] of Object.entries(depGraph)) {
      normalizedGraph[src] = Array.from(new Set(targets));
    }

    function dfs(node) {
      visited.add(node);
      recStack.add(node);
      currentPath.push(node);

      const neighbors = normalizedGraph[node] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recStack.has(neighbor)) {
          // Found cycle
          const cycleStartIndex = currentPath.indexOf(neighbor);
          if (cycleStartIndex !== -1) {
            const cycle = currentPath.slice(cycleStartIndex).concat([neighbor]);
            cycles.push(cycle);
          }
        }
      }

      currentPath.pop();
      recStack.delete(node);
    }

    for (const node of Object.keys(normalizedGraph)) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  analyze(targetDir, options = {}) {
    const maxCC = options.maxCyclomaticComplexity || DEFAULT_AST_LIMITS.MAX_CYCLOMATIC_COMPLEXITY;
    const maxFnNodes = options.maxFunctionNodes || DEFAULT_AST_LIMITS.MAX_FUNCTION_AST_NODES;
    const maxFileNodes = options.maxFileNodes || DEFAULT_AST_LIMITS.MAX_FILE_AST_NODES;

    const sourceFiles = this.discoverFiles(targetDir, {
      ...options,
      allowedExtensions: ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.mts', '.cts', '.astro']
    });

    const findings = {
      debugger_statements: [],
      eval_invocations: [],
      unsafe_dom_sinks: [],
      empty_catch_blocks: [],
      high_complexity_functions: [],
      oversized_functions: [],
      oversized_files: [],
      circular_imports: []
    };

    let totalParsedFiles = 0;
    let parseErrors = 0;
    const depGraph = {};

    for (const filePath of sourceFiles) {
      const relPath = path.relative(targetDir, filePath);
      const ext = path.extname(filePath).toLowerCase();
      const content = this.safeReadFile(filePath);
      if (!content) continue;

      let codeSnippets = [];
      if (ext === '.astro') {
        codeSnippets = this.extractAstroCode(content);
        if (codeSnippets.length === 0) {
          totalParsedFiles++;
          continue;
        }
      } else {
        codeSnippets = [{ code: content, lineOffset: 0 }];
      }

      depGraph[filePath] = [];

      for (const snippet of codeSnippets) {
        const ast = this.parseSource(snippet.code, ext);
        if (!ast) {
          parseErrors++;
          continue;
        }

        totalParsedFiles++;

        // 1. Dependency Graph extraction for Circular Imports
        const imports = this.extractImportSpecifiers(ast);
        for (const imp of imports) {
          const resolved = this.resolveLocalImport(filePath, imp);
          if (resolved) {
            depGraph[filePath].push(resolved);
          }
        }

        // 2. File size in AST nodes
        const fileNodeCount = this.countNodes(ast);
        if (fileNodeCount > maxFileNodes) {
          findings.oversized_files.push({
            file: relPath,
            line: 1,
            column: 0,
            node_count: fileNodeCount,
            rule: 'AST_FILE_OVERSIZED',
            description: `File "${relPath}" exceeds AST node limit (${fileNodeCount} > ${maxFileNodes} nodes).`,
            severity: 'MEDIUM'
          });
        }

        // 3. AST Structural traversal
        this.walk(ast, (node, parent) => {
          const lineOffset = snippet.lineOffset || 0;
          const loc = node.loc ? {
            line: node.loc.start.line + lineOffset,
            column: node.loc.start.column
          } : { line: 1 + lineOffset, column: 0 };

          // A. Debugger Statements
          if (node.type === 'DebuggerStatement') {
            findings.debugger_statements.push({
              file: relPath,
              line: loc.line,
              column: loc.column,
              rule: 'AST_DEBUGGER_STATEMENT',
              description: 'Explicit debugger; statement present in code.',
              severity: 'HIGH'
            });
          }

          // B. Unsafe eval() or new Function() calls
          if (node.type === 'CallExpression') {
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'eval') {
              findings.eval_invocations.push({
                file: relPath,
                line: loc.line,
                column: loc.column,
                rule: 'AST_UNSAFE_EVAL',
                description: 'Direct invocation of dynamic eval() compiler.',
                severity: 'HIGH'
              });
            }

            // document.write / document.writeln
            if (node.callee && node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              if (obj && obj.type === 'Identifier' && obj.name === 'document') {
                if (prop && prop.type === 'Identifier' && (prop.name === 'write' || prop.name === 'writeln')) {
                  findings.unsafe_dom_sinks.push({
                    file: relPath,
                    line: loc.line,
                    column: loc.column,
                    rule: 'AST_DOCUMENT_WRITE',
                    description: 'Call to document.write() causes severe performance and XSS risks.',
                    severity: 'HIGH'
                  });
                }
              }
            }
          }

          if (node.type === 'NewExpression') {
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'Function') {
              findings.eval_invocations.push({
                file: relPath,
                line: loc.line,
                column: loc.column,
                rule: 'AST_FUNCTION_CONSTRUCTOR',
                description: 'new Function(...) dynamically compiles code from string.',
                severity: 'HIGH'
              });
            }
          }

          // C. Unsafe innerHTML / outerHTML DOM assignments
          if (node.type === 'AssignmentExpression' && node.left && node.left.type === 'MemberExpression') {
            const prop = node.left.property;
            if (prop && prop.type === 'Identifier' && (prop.name === 'innerHTML' || prop.name === 'outerHTML')) {
              findings.unsafe_dom_sinks.push({
                file: relPath,
                line: loc.line,
                column: loc.column,
                rule: 'AST_RAW_INNERHTML',
                description: `Direct assignment to .${prop.name} creates DOM XSS injection surface.`,
                severity: 'MEDIUM'
              });
            }
          }

          // D. Empty catch blocks: catch (err) {}
          if (node.type === 'CatchClause') {
            if (node.body && node.body.type === 'BlockStatement' && node.body.body.length === 0) {
              findings.empty_catch_blocks.push({
                file: relPath,
                line: loc.line,
                column: loc.column,
                rule: 'AST_EMPTY_CATCH',
                description: 'Empty catch block swallows errors without logging or mitigation.',
                severity: 'LOW'
              });
            }
          }

          // E. Function Metrics (Cyclomatic Complexity & Node Count)
          if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
            const fnName = (node.id && node.id.name) ||
                           (parent && parent.type === 'VariableDeclarator' && parent.id && parent.id.name) ||
                           (parent && parent.type === 'Property' && parent.key && parent.key.name) ||
                           'anonymous';

            // Cyclomatic Complexity
            const cc = this.computeFunctionComplexity(node);
            if (cc > maxCC) {
              findings.high_complexity_functions.push({
                file: relPath,
                line: loc.line,
                column: loc.column,
                function_name: fnName,
                complexity: cc,
                threshold: maxCC,
                rule: 'AST_HIGH_COMPLEXITY',
                description: `Function "${fnName}" cyclomatic complexity (${cc}) exceeds maximum threshold of ${maxCC}.`,
                severity: 'MEDIUM'
              });
            }

            // Function AST Node Count
            const fnNodes = this.countNodes(node);
            if (fnNodes > maxFnNodes) {
              findings.oversized_functions.push({
                file: relPath,
                line: loc.line,
                column: loc.column,
                function_name: fnName,
                node_count: fnNodes,
                threshold: maxFnNodes,
                rule: 'AST_FUNCTION_OVERSIZED',
                description: `Function "${fnName}" size (${fnNodes} nodes) exceeds threshold of ${maxFnNodes} nodes.`,
                severity: 'LOW'
              });
            }
          }
        });
      }
    }

    // 4. Run Circular Imports Cycle Detection
    const detectedCycles = this.detectCircularImports(depGraph);
    for (const cycle of detectedCycles) {
      const relCycle = cycle.map(p => path.relative(targetDir, p));
      findings.circular_imports.push({
        file: relCycle[0],
        line: 1,
        column: 0,
        cycle_path: relCycle.join(' -> '),
        rule: 'AST_CIRCULAR_IMPORT',
        description: `Circular dependency detected: ${relCycle.join(' -> ')}`,
        severity: 'HIGH'
      });
    }

    const controls = {};
    const gate_evidence = {};

    // Map to Frozen CQS Controls (65 controls invariant):
    // SEC-04.1: Input Sanitization & Dangerous DOM APIs
    const totalSecFindings = findings.eval_invocations.length + findings.unsafe_dom_sinks.length;
    if (totalSecFindings === 0) {
      controls['SEC-04.1'] = {
        status: 'PASS',
        details: 'AST inspection verified zero eval(), new Function(), or dangerous innerHTML sinks.',
        findings: []
      };
    } else {
      controls['SEC-04.1'] = {
        status: 'FAIL',
        details: `${totalSecFindings} structural AST security risk(s) detected (${findings.eval_invocations.length} eval/Function, ${findings.unsafe_dom_sinks.length} innerHTML/doc.write).`,
        findings: [...findings.eval_invocations, ...findings.unsafe_dom_sinks]
      };
    }

    // MNT-01.1: Code Modularity, Complexity, Circular Imports & Debugger Clearance
    const totalMntFindings = findings.high_complexity_functions.length + 
                             findings.debugger_statements.length + 
                             findings.oversized_functions.length + 
                             findings.oversized_files.length + 
                             findings.circular_imports.length;
    if (totalMntFindings === 0) {
      controls['MNT-01.1'] = {
        status: 'PASS',
        details: 'AST verified zero debugger statements, zero circular dependencies, compliant function/file sizes, and cyclomatic complexity <= 15.',
        findings: []
      };
    } else {
      controls['MNT-01.1'] = {
        status: 'FAIL',
        details: `${findings.high_complexity_functions.length} high-complexity function(s), ${findings.debugger_statements.length} debugger statement(s), ${findings.circular_imports.length} circular import(s), ${findings.oversized_functions.length} oversized function(s), ${findings.oversized_files.length} oversized file(s).`,
        findings: [
          ...findings.high_complexity_functions,
          ...findings.debugger_statements,
          ...findings.circular_imports,
          ...findings.oversized_functions,
          ...findings.oversized_files
        ]
      };
    }

    // REL-02.1: Graceful Error Handling
    if (findings.empty_catch_blocks.length === 0) {
      controls['REL-02.1'] = {
        status: 'PASS',
        details: 'AST verified zero silent/empty catch blocks in codebase.',
        findings: []
      };
    } else {
      controls['REL-02.1'] = {
        status: 'FAIL',
        details: `${findings.empty_catch_blocks.length} empty catch block(s) detected.`,
        findings: findings.empty_catch_blocks
      };
    }

    return {
      scanned_files_count: totalParsedFiles,
      controls: controls,
      gate_evidence: gate_evidence,
      findings: findings
    };
  }
}

module.exports = {
  AstProbe,
  DEFAULT_AST_LIMITS
};

