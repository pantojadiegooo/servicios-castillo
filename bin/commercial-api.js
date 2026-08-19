#!/usr/bin/env node

/**
 * ============================================================================
 * GRUPO CASTILLO — LANZADOR DE API COMERCIAL (CLI)
 * ============================================================================
 */

import { startCommercialServer } from '../src/commercial/api/server.js';

const port = parseInt(process.env.PORT || '4321', 10);
const dbPath = process.env.DB_PATH || undefined;

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║   GRUPO CASTILLO — SISTEMA COMERCIAL Y EXPEDIENTE DIGITAL      ║');
console.log('║   API Server v1.1.0 • Running on Node 24 Native SQLite Engine   ║');
console.log('╚════════════════════════════════════════════════════════════════╝');

startCommercialServer(port, dbPath);
