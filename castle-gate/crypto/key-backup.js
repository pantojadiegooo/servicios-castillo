/**
 * Castle Security & Quality Gate — Secure Encrypted Key Backup & Recovery
 * 
 * Provides AES-256-GCM authenticated encryption with PBKDF2 key derivation
 * for offline disaster recovery of Ed25519 private keys.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { deriveKeyId } = require('./signing-key');

const BACKUP_SCHEMA = '1.0.0-key-backup';
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST = 'sha512';
const KEY_LENGTH_BYTES = 32; // 256 bits for AES-256

/**
 * Creates an encrypted backup of an Ed25519 private key using AES-256-GCM.
 * 
 * @param {string} privateKeyPem Ed25519 private key in PEM format
 * @param {string} passphrase Strong passphrase for encryption
 * @param {Object} [options]
 * @returns {Object} Encrypted backup envelope
 */
function createKeyBackup(privateKeyPem, passphrase, options = {}) {
  if (!privateKeyPem || typeof privateKeyPem !== 'string' || !privateKeyPem.includes('PRIVATE KEY')) {
    throw new Error('[Key Backup] Valid privateKeyPem is required for backup.');
  }
  if (!passphrase || typeof passphrase !== 'string' || passphrase.length < 8) {
    throw new Error('[Key Backup] Passphrase must be at least 8 characters long.');
  }

  // Derive public key and Key ID from private key
  const privObj = crypto.createPrivateKey(privateKeyPem);
  const pubObj = crypto.createPublicKey(privObj);
  const pubPem = pubObj.export({ type: 'spki', format: 'pem' });
  const keyId = deriveKeyId(pubPem);

  // Generate random salt and IV
  const salt = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM

  // Derive encryption key using PBKDF2
  const derivedKey = crypto.pbkdf2Sync(
    passphrase,
    salt,
    options.iterations || PBKDF2_ITERATIONS,
    KEY_LENGTH_BYTES,
    PBKDF2_DIGEST
  );

  // Encrypt private key with AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
  const encryptedBuffer = Buffer.concat([
    cipher.update(Buffer.from(privateKeyPem, 'utf8')),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  const backupPayload = {
    schema_version: BACKUP_SCHEMA,
    backup_id: options.backup_id || `BAK-KEY-${Date.now()}`,
    created_at: new Date().toISOString(),
    key_id: keyId,
    algorithm: 'ed25519',
    description: options.description || 'Castle Gate Ed25519 Encrypted Private Key Backup',
    crypto_params: {
      cipher: 'aes-256-gcm',
      kdf: 'pbkdf2',
      hash: PBKDF2_DIGEST,
      iterations: options.iterations || PBKDF2_ITERATIONS,
      salt_hex: salt.toString('hex'),
      iv_hex: iv.toString('hex'),
      auth_tag_hex: authTag.toString('hex')
    },
    encrypted_key_base64: encryptedBuffer.toString('base64'),
    public_key_fingerprint: keyId
  };

  return backupPayload;
}

/**
 * Restores and verifies an Ed25519 private key from an encrypted backup envelope.
 * 
 * @param {Object|string} backupData Backup object or JSON string or file path
 * @param {string} passphrase Passphrase used during backup
 * @returns {Object} { privateKeyPem, publicKeyPem, keyId, restored: true }
 */
function restoreKeyBackup(backupData, passphrase) {
  let parsedBackup = backupData;
  if (typeof backupData === 'string') {
    if (fs.existsSync(backupData)) {
      parsedBackup = JSON.parse(fs.readFileSync(backupData, 'utf8'));
    } else {
      try {
        parsedBackup = JSON.parse(backupData);
      } catch (e) {
        throw new Error(`[Key Backup] Malformed backup JSON: ${e.message}`);
      }
    }
  }

  if (!parsedBackup || !parsedBackup.crypto_params || !parsedBackup.encrypted_key_base64) {
    throw new Error('[Key Backup] Invalid backup format: missing crypto_params or encrypted_key_base64.');
  }

  const { cipher, kdf, hash, iterations, salt_hex, iv_hex, auth_tag_hex } = parsedBackup.crypto_params;

  if (cipher !== 'aes-256-gcm' || kdf !== 'pbkdf2') {
    throw new Error(`[Key Backup] Unsupported encryption params: ${cipher}/${kdf}`);
  }

  const salt = Buffer.from(salt_hex, 'hex');
  const iv = Buffer.from(iv_hex, 'hex');
  const authTag = Buffer.from(auth_tag_hex, 'hex');
  const encryptedBuffer = Buffer.from(parsedBackup.encrypted_key_base64, 'base64');

  // Derive key
  const derivedKey = crypto.pbkdf2Sync(
    passphrase,
    salt,
    iterations || PBKDF2_ITERATIONS,
    KEY_LENGTH_BYTES,
    hash || PBKDF2_DIGEST
  );

  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(authTag);

    const decryptedBuffer = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final()
    ]);

    const privateKeyPem = decryptedBuffer.toString('utf8');

    // Verify key validity
    const privObj = crypto.createPrivateKey(privateKeyPem);
    const pubObj = crypto.createPublicKey(privObj);
    const pubPem = pubObj.export({ type: 'spki', format: 'pem' });
    const recoveredKeyId = deriveKeyId(pubPem);

    if (parsedBackup.key_id && recoveredKeyId !== parsedBackup.key_id) {
      throw new Error(`Recovered key ID "${recoveredKeyId}" does not match backup key ID "${parsedBackup.key_id}".`);
    }

    return {
      privateKeyPem,
      publicKeyPem: pubPem,
      keyId: recoveredKeyId,
      restored: true,
      backup_id: parsedBackup.backup_id,
      created_at: parsedBackup.created_at
    };
  } catch (err) {
    throw new Error(`[Key Backup Recovery Failed] Authentication failed or incorrect passphrase: ${err.message}`);
  }
}

/**
 * Saves encrypted backup to disk with restricted permissions.
 */
function saveKeyBackupToFile(backupObject, targetFilePath) {
  const dir = path.dirname(targetFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(targetFilePath, JSON.stringify(backupObject, null, 2), { encoding: 'utf8', mode: 0o600 });
  return targetFilePath;
}

module.exports = {
  createKeyBackup,
  restoreKeyBackup,
  saveKeyBackupToFile,
  BACKUP_SCHEMA
};
