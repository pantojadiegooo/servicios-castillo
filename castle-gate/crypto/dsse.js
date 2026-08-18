/**
 * Castle Security & Quality Gate — Dead Simple Signing Envelope (DSSE) & in-toto
 * 
 * Implements standard DSSE (Dead Simple Signing Envelope) protocol:
 * https://github.com/secure-systems-lab/dsse
 * Paves direct compatibility with in-toto, Sigstore, Cosign, and SLSA attestations.
 */

'use strict';

const crypto = require('crypto');
const { canonicalize } = require('./canonicalizer');
const { deriveKeyId } = require('./signing-key');

/**
 * Pre-Authentication Encoding (PAE) according to DSSE specification.
 * PAE(type, body) = "DSSEv1 " + len(type) + " " + type + " " + len(body) + " " + body
 * 
 * @param {string} payloadType MIME or URI type of payload
 * @param {Buffer} payloadBuffer Raw payload buffer
 * @returns {Buffer} Encoded PAE buffer
 */
function createPAE(payloadType, payloadBuffer) {
  const typeBuf = Buffer.from(payloadType, 'utf8');
  const header = `DSSEv1 ${typeBuf.length} `;
  const separator = ` ${payloadBuffer.length} `;
  return Buffer.concat([
    Buffer.from(header, 'utf8'),
    typeBuf,
    Buffer.from(separator, 'utf8'),
    payloadBuffer
  ]);
}

/**
 * Creates and signs a DSSE Envelope over an arbitrary JSON statement (e.g. in-toto Statement).
 * 
 * @param {Object} statement Object payload to encapsulate
 * @param {string|crypto.KeyObject} privateKeyPem Ed25519 private key
 * @param {Object} [options] { payloadType, keyId }
 * @returns {Object} DSSE Envelope
 */
function createDsseEnvelope(statement, privateKeyPem, options = {}) {
  const payloadType = options.payloadType || 'application/vnd.in-toto+json';
  const canonicalStatement = canonicalize(statement);
  const payloadBuffer = Buffer.from(canonicalStatement, 'utf8');
  const paeBuffer = createPAE(payloadType, payloadBuffer);

  let privKeyObj = typeof privateKeyPem === 'string' ? crypto.createPrivateKey(privateKeyPem) : privateKeyPem;
  const pubKeyObj = crypto.createPublicKey(privKeyObj);
  const keyId = options.keyId || deriveKeyId(pubKeyObj);

  const sigBuffer = crypto.sign(null, paeBuffer, privKeyObj);

  return {
    payloadType: payloadType,
    payload: payloadBuffer.toString('base64'),
    signatures: [
      {
        keyid: keyId,
        sig: sigBuffer.toString('base64')
      }
    ]
  };
}

/**
 * Verifies a DSSE Envelope with a public key and returns the unpacked, authenticated statement.
 * 
 * @param {Object} envelope DSSE Envelope object
 * @param {string|crypto.KeyObject} publicKeyPem Ed25519 public key
 * @returns {Object} { valid: boolean, payload?: Object, error?: string, keyid?: string }
 */
function verifyDsseEnvelope(envelope, publicKeyPem) {
  if (!envelope || typeof envelope !== 'object') {
    return { valid: false, error: 'Invalid DSSE envelope format.' };
  }
  if (!envelope.payloadType || !envelope.payload || !Array.isArray(envelope.signatures) || envelope.signatures.length === 0) {
    return { valid: false, error: 'Malformed DSSE envelope: missing payloadType, payload, or signatures.' };
  }
  if (!publicKeyPem) {
    return { valid: false, error: 'Missing public key for DSSE verification.' };
  }

  try {
    const payloadBuffer = Buffer.from(envelope.payload, 'base64');
    const paeBuffer = createPAE(envelope.payloadType, payloadBuffer);

    let pubKeyObj = typeof publicKeyPem === 'string' ? crypto.createPublicKey(publicKeyPem) : publicKeyPem;
    const expectedKeyId = deriveKeyId(pubKeyObj);

    let matchedSignature = null;
    for (const sigEntry of envelope.signatures) {
      if (!sigEntry.keyid || sigEntry.keyid === expectedKeyId) {
        matchedSignature = sigEntry;
        break;
      }
    }

    if (!matchedSignature) {
      // Fallback: test first signature
      matchedSignature = envelope.signatures[0];
    }

    const sigBuffer = Buffer.from(matchedSignature.sig, 'base64');
    const isValid = crypto.verify(null, paeBuffer, pubKeyObj, sigBuffer);

    if (!isValid) {
      return {
        valid: false,
        error: 'DSSE signature verification failed (envelope payload tampered or incorrect public key).'
      };
    }

    const statementJson = JSON.parse(payloadBuffer.toString('utf8'));

    return {
      valid: true,
      error: null,
      keyid: matchedSignature.keyid,
      payloadType: envelope.payloadType,
      statement: statementJson
    };
  } catch (err) {
    return {
      valid: false,
      error: `DSSE verification failed: ${err.message}`
    };
  }
}

/**
 * Builds an in-toto v1 Statement object wrapping Castle Gate Evidence.
 * 
 * @param {Object} params { subjectName, commitSha, predicate }
 * @returns {Object} in-toto Statement
 */
function createInTotoStatement(params) {
  const { subjectName, commitSha, predicate } = params;

  return {
    _type: 'https://in-toto.io/Statement/v1',
    subject: [
      {
        name: subjectName || 'repository',
        digest: {
          sha256: commitSha || 'unspecified'
        }
      }
    ],
    predicateType: 'https://castlegate.grupocastillo.com/assurance/v1',
    predicate: predicate || {}
  };
}

module.exports = {
  createPAE,
  createDsseEnvelope,
  verifyDsseEnvelope,
  createInTotoStatement
};
