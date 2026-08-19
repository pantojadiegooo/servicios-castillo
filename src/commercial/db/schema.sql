-- ============================================================================
-- GRUPO CASTILLO — ESQUEMA RELACIONAL DEL SISTEMA COMERCIAL Y EXPEDIENTE
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  rfc_tax_id TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL UNIQUE,
  contact_phone TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 2. TABLA DE USUARIOS INTERNOS (ADMINISTRACIÓN E INGENIERÍA)
CREATE TABLE IF NOT EXISTS internal_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('ADMINISTRACION', 'INGENIERO')),
  job_title TEXT NOT NULL,
  department TEXT NOT NULL,
  photo_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 3. TABLA DE PROYECTOS / EXPEDIENTES
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, -- Formato: GC-Q-YYYY-XXXXXX
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  assigned_engineer_id TEXT REFERENCES internal_users(id) ON DELETE SET NULL,
  service_package_id TEXT NOT NULL, -- ej: iron, bronze, silver, gold, platinum, diamond, checkup, audit, rescue, care
  service_type TEXT NOT NULL CHECK(service_type IN ('BUILD_PACKAGE', 'SPECIALIZED_SERVICE')),
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'DRAFT',
  progress_percentage REAL NOT NULL DEFAULT 0.0,
  target_delivery_date TEXT,
  inactivity_days INTEGER NOT NULL DEFAULT 0,
  inactivity_alerts_sent INTEGER NOT NULL DEFAULT 0,
  last_client_activity_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  portal_access_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 4. TABLA DE COTIZACIONES Y VERSIONES
CREATE TABLE IF NOT EXISTS quotation_versions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  scope_description TEXT NOT NULL,
  inventory_routes_json TEXT NOT NULL DEFAULT '[]',
  subtotal_mxn REAL NOT NULL,
  tax_rate REAL NOT NULL DEFAULT 0.16,
  tax_amount_mxn REAL NOT NULL,
  total_mxn REAL NOT NULL,
  valid_until_date TEXT NOT NULL, -- 15 días naturales
  is_accepted INTEGER NOT NULL DEFAULT 0,
  accepted_at TEXT,
  accepted_by_name TEXT,
  accepted_by_email TEXT,
  accepted_ip_address TEXT,
  digest_sha256 TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(project_id, version_number)
);

-- 5. TABLA DE CONTRATOS (MSA + CONDICIONES PARTICULARES SOW)
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  msa_version TEXT NOT NULL DEFAULT 'v1.0.0',
  sow_reference_id TEXT NOT NULL,
  is_signed INTEGER NOT NULL DEFAULT 0,
  signed_at TEXT,
  signer_name TEXT,
  signer_title TEXT,
  signer_rfc TEXT,
  signer_ip_address TEXT,
  contract_hash_sha256 TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 6. TABLA DE HITOS DE PROYECTO
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- H1, H2, H3, H4, etc.
  name TEXT NOT NULL,
  description TEXT,
  weight REAL NOT NULL DEFAULT 25.0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED')),
  evidence_url TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 7. TABLA DE PAGOS Y TRANSACCIONES FINANCIERAS
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  concept TEXT NOT NULL, -- 'ANTICIPO_50', 'FINIQUITO_50', 'HITO_1', 'RESCUE_FEE', etc.
  milestone_id TEXT REFERENCES milestones(id) ON DELETE SET NULL,
  subtotal_mxn REAL NOT NULL,
  tax_amount_mxn REAL NOT NULL,
  total_mxn REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('STRIPE', 'MERCADO_PAGO', 'TRANSFERENCIA_SPEI')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PENDING_VERIFICATION', 'PAID', 'FAILED', 'REFUNDED', 'CHARGEBACK_DISPUTE')),
  external_transaction_id TEXT,
  comprobante_url TEXT,
  verified_by_admin_id TEXT REFERENCES internal_users(id),
  verified_at TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 8. TABLA DE PREENTREGA Y OBSERVACIONES
CREATE TABLE IF NOT EXISTS pre_deliveries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  staging_url TEXT NOT NULL,
  castle_gate_validation_id TEXT,
  castle_gate_score REAL,
  castle_gate_cert_json TEXT,
  client_decision TEXT CHECK(client_decision IN ('APPROVED', 'OBSERVATIONS_SUBMITTED', NULL)),
  client_decision_at TEXT,
  observations_notes TEXT,
  observations_evidence_urls_json TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 9. TABLA DE TICKETS DE SOPORTE / GARANTÍA
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY, -- Formato: GC-T-YYYY-XXXXXX
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('S1', 'S2', 'S3', 'S4')),
  internal_status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK(internal_status IN ('RECEIVED', 'INVESTIGATING', 'IN_SOLUTION', 'RESOLVED_INTERNAL', 'CLOSED')),
  client_facing_status TEXT NOT NULL DEFAULT 'Recibido' CHECK(client_facing_status IN ('Recibido', 'En investigación', 'En solución', 'Resuelto')),
  assigned_engineer_id TEXT REFERENCES internal_users(id) ON DELETE SET NULL,
  sla_response_due_at TEXT NOT NULL,
  sla_resolution_due_at TEXT NOT NULL,
  resolved_at TEXT,
  client_confirmed_resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 10. TABLA DE MENSAJES Y EVIDENCIA DE TICKETS
CREATE TABLE IF NOT EXISTS ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK(sender_role IN ('CLIENTE', 'INGENIERO', 'ADMINISTRACION')),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  evidence_urls_json TEXT DEFAULT '[]',
  is_internal_note INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 11. TABLA DE EXPEDIENTE DOCUMENTAL
CREATE TABLE IF NOT EXISTS expediente_documentos (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK(category IN ('COMERCIAL', 'LEGAL', 'FINANCIERO', 'INGENIERIA_QA', 'HANDOFF_ENTREGA', 'POST_ENTREGA')),
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1.0',
  sha256_hash TEXT NOT NULL,
  uploaded_by_role TEXT NOT NULL,
  uploaded_by_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 12. TABLA DE AUDITORÍA INMUTABLE (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY, -- Formato: GC-E-YYYY-XXXXXX
  project_id TEXT,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_ip TEXT,
  action TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT,
  rationale TEXT NOT NULL,
  evidence_hash_sha256 TEXT,
  metadata_json TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 13. TABLA DE TOKENS OTP (AUTENTICACIÓN PASSWORDLESS)
CREATE TABLE IF NOT EXISTS otp_tokens (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  hashed_token TEXT NOT NULL,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  expires_at TEXT NOT NULL,
  is_used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 14. TABLA DE SESIONES ACTIVAS
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('CLIENTE', 'INGENIERO', 'ADMINISTRACION')),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  session_token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 15. TABLA DE EVENTOS DE WEBHOOK (IDEMPOTENCIA Y PROTECCIÓN REPLAY)
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY, -- provider_event_id
  provider TEXT NOT NULL CHECK(provider IN ('STRIPE', 'MERCADO_PAGO')),
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  status TEXT NOT NULL DEFAULT 'PROCESSED'
);

-- ÍNDICES PARA RENDIMIENTO Y AISLAMIENTO
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_engineer ON projects(assigned_engineer_id);
CREATE INDEX IF NOT EXISTS idx_projects_state ON projects(state);
CREATE INDEX IF NOT EXISTS idx_quotations_project ON quotation_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_project ON tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_engineer_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON expediente_documentos(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_project ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_tokens(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token_hash);
