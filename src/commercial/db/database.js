/**
 * ============================================================================
 * GRUPO CASTILLO — MOTOR DE BASE DE DATOS TRANSACCIONAL (v1.1)
 * ============================================================================
 * Implementa la capa de persistencia relacional con node:sqlite nativo.
 * Soporta modo en memoria para suites de pruebas y persistencia en archivo
 * con foreign keys activos, transacciones ACID y consultas preparadas.
 */

import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_PATH = resolve(__dirname, 'schema.sql');
const DEFAULT_DB_PATH = resolve(process.cwd(), '.castle', 'commercial.sqlite');

/**
 * Inicializa y configura una instancia de base de datos SQLite.
 * @param {string} [dbPath=':memory:'] - Ruta al archivo .sqlite o ':memory:'
 * @returns {DatabaseSync}
 */
export function createDatabase(dbPath = ':memory:') {
  if (dbPath !== ':memory:') {
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // Ejecutar migraciones / esquema DDL
  const schemaSql = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schemaSql);

  // Sembrar datos iniciales si no existen usuarios internos
  seedInitialData(db);

  return db;
}

/**
 * Sembrado inicial de roles de administración e ingeniería.
 * @param {DatabaseSync} db
 */
export function seedInitialData(db) {
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM internal_users');
  const result = checkStmt.get();

  if (result && result.count === 0) {
    const insertStmt = db.prepare(`
      INSERT INTO internal_users (id, name, last_name, email, role, job_title, department, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Administrador General
    insertStmt.run(
      'usr_admin_01',
      'Diego',
      'Pantoja',
      'diego@grupocastillo.com',
      'ADMINISTRACION',
      'Director General',
      'Dirección Ejecutiva',
      '/assets/brand/symbol/symbol-256.png'
    );

    // Ingeniero Líder
    insertStmt.run(
      'usr_eng_01',
      'Alejandro',
      'Morales',
      'alejandro.morales@grupocastillo.com',
      'INGENIERO',
      'Ingeniero de Software Principal',
      'Práctica de Arquitectura Web',
      '/assets/brand/symbol/symbol-128.png'
    );

    // Ingeniero de QA y Seguridad
    insertStmt.run(
      'usr_eng_02',
      'Valeria',
      'Castillo',
      'valeria.castillo@grupocastillo.com',
      'INGENIERO',
      'Líder de Calidad y Gobernanza CQS',
      'Aseguramiento de Calidad',
      '/assets/brand/symbol/symbol-128.png'
    );
  }
}

// Singleton de base de datos para la aplicación
let defaultDbInstance = null;

export function getDatabase(dbPath = DEFAULT_DB_PATH) {
  if (!defaultDbInstance) {
    defaultDbInstance = createDatabase(dbPath);
  }
  return defaultDbInstance;
}

export function closeDatabase() {
  if (defaultDbInstance) {
    defaultDbInstance.close();
    defaultDbInstance = null;
  }
}
