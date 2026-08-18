/**
 * Castle Security & Quality Gate — Asymmetric Cryptographic Key Management (Ed25519)
 * 
 * Generates and manages Ed25519 asymmetric key pairs for tamper-proof digital signatures.
 * Follows industry-standard PKCS#8 and SPKI formats compatible with Sigstore/Cosign.
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Derives a deterministic Key ID / fingerprint from a public key.
 * 
 * @param {string|crypto.KeyObject} publicKey SPKI PEM string or KeyObject
 * @returns {string} Key identifier e.g. "ed25519:abcdef012345..."
 */
function deriveKeyId(publicKey) {
  let derBuffer;
  if (typeof publicKey === 'string') {
    const pubObj = crypto.createPublicKey(publicKey);
    derBuffer = pubObj.export({ type: 'spki', format: 'der' });
  } else {
    derBuffer = publicKey.export({ type: 'spki', format: 'der' });
  }
  const fingerprint = crypto.createHash('sha256').update(derBuffer).digest('hex').substring(0, 16);
  return `ed25519:${fingerprint}`;
}

/**
 * Generates a new Ed25519 asymmetric key pair.
 * 
 * @returns {Object} { privateKeyPem, publicKeyPem, keyId }
 */
function generateKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  const keyId = deriveKeyId(publicKey);

  return {
    privateKeyPem: privateKey,
    publicKeyPem: publicKey,
    keyId: keyId,
    algorithm: 'ed25519',
    created_at: new Date().toISOString()
  };
}

/**
 * Saves a key pair to a specified directory.
 * 
 * @param {Object} keyPair 
 * @param {string} targetDir 
 * @param {string} [prefix='castle-gate'] 
 * @returns {Object} { privateKeyPath, publicKeyPath }
 */
function saveKeyPair(keyPair, targetDir, prefix = 'castle-gate') {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const privateKeyPath = path.join(targetDir, `${prefix}-private.pem`);
  const publicKeyPath = path.join(targetDir, `${prefix}-public.pem`);

  // Write private key with restricted permissions where supported
  fs.writeFileSync(privateKeyPath, keyPair.privateKeyPem, { encoding: 'utf8', mode: 0o600 });
  fs.writeFileSync(publicKeyPath, keyPair.publicKeyPem, { encoding: 'utf8', mode: 0o644 });

  return {
    privateKeyPath,
    publicKeyPath,
    keyId: keyPair.keyId
  };
}

/**
 * Loads a key pair or public key from disk.
 * 
 * @param {string} keyPath Path to PEM file or directory containing keys
 * @returns {Object} { keyPem, type: 'private'|'public', keyId }
 */
function loadKey(keyPath) {
  if (!fs.existsSync(keyPath)) {
    throw new Error(`[Castle Crypto] Key file not found: ${keyPath}`);
  }

  const pem = fs.readFileSync(keyPath, 'utf8');
  if (pem.includes('PRIVATE KEY')) {
    const privObj = crypto.createPrivateKey(pem);
    const pubObj = crypto.createPublicKey(privObj);
    const publicKeyPem = pubObj.export({ type: 'spki', format: 'pem' });
    return {
      privateKeyPem: pem,
      publicKeyPem: publicKeyPem,
      type: 'private',
      keyId: deriveKeyId(publicKeyPem)
    };
  } else if (pem.includes('PUBLIC KEY')) {
    return {
      publicKeyPem: pem,
      type: 'public',
      keyId: deriveKeyId(pem)
    };
  } else {
    throw new Error(`[Castle Crypto] Unrecognized PEM format in file: ${keyPath}`);
  }
}

module.exports = {
  generateKeyPair,
  deriveKeyId,
  saveKeyPair,
  loadKey
};
