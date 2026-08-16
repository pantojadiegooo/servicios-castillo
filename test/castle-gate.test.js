import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

import { runCastleGate } from '../src/castle-gate/engine.js';
import { verifyCertificate, generateValidationId } from '../src/castle-gate/certificate.js';

describe('Castle Gate Engine — CQS v1.1 Verification Suite', () => {
  const passDir = path.resolve('test/fixtures/pass-project');
  const failDir = path.resolve('test/fixtures/fail-project');

  it('1. PASS Fixture: Successfully passes C1/C2 policy with zero Gate Breakers', async () => {
    const res = await runCastleGate(passDir, { level: 'C1', skipAudit: true });
    assert.strictEqual(res.exitCode, 0, 'Exit code must be 0 for clean project');
    assert.strictEqual(res.evaluation.status, 'PASS');
    assert.strictEqual(res.evaluation.gateBreakersActive, 0);
    assert.strictEqual(res.evaluation.secretsDetected, 0);
    assert.ok(res.evaluation.score >= 60.0, 'Score must meet C1 threshold');
    assert.ok(fs.existsSync(res.artifacts.certPath), 'Certificate file must be written');
    assert.ok(fs.existsSync(res.artifacts.htmlPath), 'HTML compliance report must be written');
  });

  it('2. FAIL Fixture: Correctly blocks release on active Gate Breakers (Secrets)', async () => {
    const res = await runCastleGate(failDir, { level: 'C1', skipAudit: true });
    assert.strictEqual(res.exitCode, 1, 'Exit code must be 1 when Gate Breakers active');
    assert.strictEqual(res.evaluation.status, 'FAIL');
    assert.ok(res.evaluation.gateBreakersActive >= 2, 'Must detect at least 2 gate breakers');
    assert.ok(res.evaluation.secretsDetected >= 2, 'Must detect at least 2 secrets');
  });

  it('3. Cryptographic Certificate: Verifies valid digest and detects tampering', async () => {
    const res = await runCastleGate(passDir, { level: 'C1', skipAudit: true });
    const verifyRes = verifyCertificate(res.artifacts.certPath);
    assert.strictEqual(verifyRes.valid, true, 'Certificate signature must verify against payload');

    // Test tampering
    const certData = JSON.parse(fs.readFileSync(res.artifacts.certPath, 'utf8'));
    certData.score = 99.99; // Malicious modification
    const tamperedPath = path.join(path.dirname(res.artifacts.certPath), 'tampered-cert.json');
    fs.writeFileSync(tamperedPath, JSON.stringify(certData), 'utf8');

    const tamperRes = verifyCertificate(tamperedPath);
    assert.strictEqual(tamperRes.valid, false, 'Tampered certificate must fail verification');
  });

  it('4. Validation ID Format: Follows strict CG-YYYY-XXXXXX taxonomy', () => {
    const id = generateValidationId();
    const regex = /^CG-\d{4}-[0-9A-F]{6}$/;
    assert.ok(regex.test(id), `Validation ID "${id}" must match CG-YYYY-XXXXXX pattern`);
  });

  it('5. CLI Execution: Exits 0 on clean target and 1 on defective target', () => {
    const cliPath = path.resolve('bin/castle-gate.js');
    
    // Test PASS on fixture
    const passCmd = `node "${cliPath}" scan --dir "${passDir}" --level C1 --skip-audit --json`;
    const passOutput = execSync(passCmd, { encoding: 'utf8' });
    const passJson = JSON.parse(passOutput);
    assert.strictEqual(passJson.exitCode, 0);

    // Test FAIL on fixture (expect non-zero exit code)
    let failThrew = false;
    try {
      const failCmd = `node "${cliPath}" scan --dir "${failDir}" --level C1 --skip-audit --json`;
      execSync(failCmd, { encoding: 'utf8' });
    } catch (e) {
      failThrew = true;
      assert.strictEqual(e.status, 1, 'CLI must exit with code 1 on failed evaluation');
    }
    assert.ok(failThrew, 'CLI execution on fail fixture must exit with error');
  });

  it('6. CLI Error Handling: Returns exit code 2 on invalid policy level', () => {
    const cliPath = path.resolve('bin/castle-gate.js');
    let errorThrew = false;
    try {
      execSync(`node "${cliPath}" scan --level C99`, { encoding: 'utf8', stdio: 'pipe' });
    } catch (e) {
      errorThrew = true;
      assert.strictEqual(e.status, 2, 'CLI must exit with code 2 on config error');
    }
    assert.ok(errorThrew, 'Invalid config must exit with code 2');
  });

  it('7. Determinism: Successive evaluations produce identical control scores', async () => {
    const run1 = await runCastleGate(passDir, { level: 'C1', skipAudit: true });
    const run2 = await runCastleGate(passDir, { level: 'C1', skipAudit: true });

    assert.strictEqual(run1.evaluation.score, run2.evaluation.score, 'Scores must be identical');
    assert.strictEqual(run1.evaluation.status, run2.evaluation.status, 'Status must be identical');
    assert.strictEqual(run1.evaluation.gateBreakersActive, run2.evaluation.gateBreakersActive);
  });
});
