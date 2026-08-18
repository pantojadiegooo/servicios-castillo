#!/usr/bin/env node

/**
 * Castle Security & Quality Gate — Global Binary Entrypoint
 * 
 * Invoked by npm / npx / global symlink:
 *   npx @grupo-castillo/castle-gate <command> [options]
 */

'use strict';

const { runCli } = require('../castle-gate/cli/bin');

const exitCode = runCli(process.argv.slice(2));
if (typeof exitCode === 'number') {
  process.exit(exitCode);
}
