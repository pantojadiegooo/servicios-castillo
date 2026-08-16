import crypto from 'node:crypto';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

export function getGitReleaseSha(targetDir) {
  try {
    const stdout = execSync('git rev-parse HEAD', { cwd: targetDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return stdout.trim();
  } catch {
    // If not a git repo, generate deterministic hash of package.json or directory
    const hash = crypto.createHash('sha256');
    try {
      const pkg = fs.readFileSync(`${targetDir}/package.json`, 'utf8');
      hash.update(pkg);
    } catch {
      hash.update(targetDir);
    }
    return hash.digest('hex');
  }
}

export function generateValidationId(year = new Date().getUTCFullYear()) {
  const randHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CG-${year}-${randHex}`;
}

export function createReleaseCertificate(data) {
  const payload = {
    validation_id: data.validationId,
    protocol: 'CQS_v1.1',
    policy_level: data.policyLevel,
    target_release_sha: data.releaseSha,
    evaluation_timestamp_utc: new Date().toISOString(),
    status: data.status,
    exit_code: data.exitCode,
    score: Number(data.score.toFixed(2)),
    secrets_detected: data.secretsDetected || 0,
    gate_breakers_active: data.gateBreakersActive || 0,
    domains_summary: data.domainsSummary || {},
    ownership: 'CLIENT_EXCLUSIVE'
  };

  // Compute canonical SHA-256 digest of payload
  const canonicalString = JSON.stringify(payload, Object.keys(payload).sort());
  const digestSha256 = crypto.createHash('sha256').update(canonicalString).digest('hex');

  return {
    ...payload,
    signature_digest_sha256: digestSha256
  };
}

export function verifyCertificate(certPath) {
  if (!fs.existsSync(certPath)) {
    return { valid: false, error: `Certificate file not found: ${certPath}` };
  }

  try {
    const cert = JSON.parse(fs.readFileSync(certPath, 'utf8'));
    const { signature_digest_sha256, ...payload } = cert;

    if (!signature_digest_sha256) {
      return { valid: false, error: 'Certificate missing signature_digest_sha256' };
    }

    const canonicalString = JSON.stringify(payload, Object.keys(payload).sort());
    const expectedDigest = crypto.createHash('sha256').update(canonicalString).digest('hex');

    const isValid = signature_digest_sha256 === expectedDigest;
    return {
      valid: isValid,
      validationId: cert.validation_id,
      policyLevel: cert.policy_level,
      status: cert.status,
      releaseSha: cert.target_release_sha,
      expectedDigest,
      actualDigest: signature_digest_sha256
    };
  } catch (e) {
    return { valid: false, error: `Malformed certificate JSON: ${e.message}` };
  }
}
