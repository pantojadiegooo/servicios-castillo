/**
 * Castle Security & Quality Gate — RFC 8785 JSON Canonicalization Scheme (JCS)
 * 
 * Implements strict deterministic canonicalization according to RFC 8785.
 * Ensures bit-for-bit identical serialization across different environments and runtimes.
 */

'use strict';

const crypto = require('crypto');

/**
 * Serializes a JavaScript value into an RFC 8785 canonical JSON string.
 * 
 * @param {*} value The value to canonicalize
 * @returns {string} The canonical JSON string representation
 */
function canonicalize(value) {
  if (value === undefined || typeof value === 'symbol' || typeof value === 'function') {
    return undefined;
  }

  if (value === null || typeof value !== 'object') {
    // Primitives: numbers, booleans, strings
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        return 'null'; // NaN and Infinity encode to null in standard JSON
      }
      // Check for negative zero
      if (Object.is(value, -0)) {
        return '0';
      }
      // Standard JSON number serialization per RFC 8785
      return JSON.stringify(value);
    }
    return JSON.stringify(value);
  }

  // Handle Date and custom toJSON methods if present
  if (typeof value.toJSON === 'function') {
    return canonicalize(value.toJSON());
  }

  // Handle Arrays
  if (Array.isArray(value)) {
    const elements = value.map(element => {
      const canonicalElement = canonicalize(element);
      return canonicalElement === undefined ? 'null' : canonicalElement;
    });
    return '[' + elements.join(',') + ']';
  }

  // Handle Objects
  // Keys must be sorted by UTF-16 code units (standard JS string sorting)
  const sortedKeys = Object.keys(value).sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  const properties = [];
  for (const key of sortedKeys) {
    const val = value[key];
    if (val === undefined || typeof val === 'symbol' || typeof val === 'function') {
      continue; // Skip undefined, symbol, and function object properties
    }
    const canonicalVal = canonicalize(val);
    if (canonicalVal !== undefined) {
      properties.push(JSON.stringify(key) + ':' + canonicalVal);
    }
  }

  return '{' + properties.join(',') + '}';
}

/**
 * Calculates deterministic cryptographic hash of an object using canonical representation.
 * 
 * @param {*} data 
 * @param {string} [algorithm='sha256'] 
 * @returns {string} Hex encoded digest
 */
function canonicalHash(data, algorithm = 'sha256') {
  const canonicalString = canonicalize(data);
  return crypto.createHash(algorithm).update(canonicalString, 'utf8').digest('hex');
}

module.exports = {
  canonicalize,
  canonicalHash
};
