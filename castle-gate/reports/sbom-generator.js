/**
 * Castle Security & Quality Gate — SBOM Generator (CycloneDX v1.5 & SPDX v2.3)
 * 
 * Generates standards-compliant Software Bill of Materials (SBOM) artifacts
 * in CycloneDX v1.5 JSON and SPDX v2.3 formats, binding them cryptographically into evaluation evidence.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Extracts dependency tree components from package.json and package-lock.json.
 * 
 * @param {string} targetDir 
 * @returns {Array<Object>} List of components
 */
function extractDependencies(targetDir) {
  const components = [];
  const pkgJsonPath = path.join(targetDir, 'package.json');
  const lockfilePath = path.join(targetDir, 'package-lock.json');

  if (!fs.existsSync(pkgJsonPath)) {
    return components;
  }

  try {
    const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

    // Check package-lock.json for complete dependency tree (direct + transitive)
    let lockData = null;
    if (fs.existsSync(lockfilePath)) {
      try {
        lockData = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
      } catch (e) {}
    }

    const seenPackages = new Set();

    if (lockData && lockData.packages && typeof lockData.packages === 'object') {
      for (const [pkgPath, info] of Object.entries(lockData.packages)) {
        if (pkgPath === '' || !info.version) continue;
        const pkgName = info.name || pkgPath.replace(/^.*node_modules\//, '');
        if (seenPackages.has(`${pkgName}@${info.version}`)) continue;
        seenPackages.add(`${pkgName}@${info.version}`);

        components.push({
          name: pkgName,
          version: info.version,
          purl: `pkg:npm/${pkgName}@${info.version}`,
          integrity: info.integrity || null,
          scope: info.dev ? 'optional' : 'required'
        });
      }
    } else {
      const directDeps = { ...(pkgData.dependencies || {}), ...(pkgData.devDependencies || {}) };
      for (const [depName, depVersionSpec] of Object.entries(directDeps)) {
        const resolvedVersion = depVersionSpec.replace(/^[\^~>=<]/, '');
        components.push({
          name: depName,
          version: resolvedVersion,
          purl: `pkg:npm/${depName}@${resolvedVersion}`,
          integrity: null,
          scope: pkgData.devDependencies && pkgData.devDependencies[depName] ? 'optional' : 'required'
        });
      }
    }
  } catch (err) {}

  // Sort components by name for strict determinism
  return components.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Generates a CycloneDX v1.5 JSON SBOM document.
 * 
 * @param {string} targetDir 
 * @param {Object} [metadata] { projectName, projectVersion, timestamp, serialNumber }
 * @returns {Object} CycloneDX 1.5 SBOM JSON
 */
function generateCycloneDxSbom(targetDir, metadata = {}) {
  const components = extractDependencies(targetDir);
  const projectName = metadata.projectName || path.basename(path.resolve(targetDir));
  const projectVersion = metadata.projectVersion || '1.0.0';
  const timestamp = metadata.timestamp || '2026-08-18T00:00:00.000Z';
  
  let serialUuid = metadata.serialNumber;
  if (!serialUuid) {
    if (metadata.commitSha) {
      const hash = crypto.createHash('sha256').update(metadata.commitSha).digest('hex');
      serialUuid = `urn:uuid:${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
    } else {
      serialUuid = 'urn:uuid:00000000-0000-4000-a000-000000000000';
    }
  }

  const cycloneDxComponents = components.map(c => {
    const compObj = {
      type: 'library',
      name: c.name,
      version: c.version,
      purl: c.purl,
      scope: c.scope
    };

    if (c.integrity && c.integrity.startsWith('sha512-')) {
      compObj.hashes = [
        {
          alg: 'SHA-512',
          content: c.integrity.substring(7)
        }
      ];
    }
    return compObj;
  });

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: serialUuid.startsWith('urn:uuid:') ? serialUuid : `urn:uuid:${serialUuid}`,
    version: 1,
    metadata: {
      timestamp: timestamp,
      tools: [
        {
          vendor: 'Grupo Castillo',
          name: 'Castle Gate SBOM Engine',
          version: '1.0.0'
        }
      ],
      component: {
        type: 'application',
        name: projectName,
        version: projectVersion
      }
    },
    components: cycloneDxComponents
  };
}

/**
 * Generates an SPDX v2.3 JSON SBOM document.
 * 
 * @param {string} targetDir 
 * @param {Object} [metadata]
 * @returns {Object} SPDX 2.3 SBOM JSON
 */
function generateSpdxSbom(targetDir, metadata = {}) {
  const components = extractDependencies(targetDir);
  const projectName = metadata.projectName || path.basename(path.resolve(targetDir));
  const projectVersion = metadata.projectVersion || '1.0.0';
  const timestamp = metadata.timestamp || '2026-08-18T00:00:00.000Z';
  const docNamespace = metadata.docNamespace || `https://grupocastillo.com/spdxdocs/${projectName}-canonical`;

  const spdxPackages = [
    {
      name: projectName,
      SPDXID: 'SPDXRef-Package-Root',
      versionInfo: projectVersion,
      downloadLocation: 'NOASSERTION',
      filesAnalyzed: false,
      supplier: 'Organization: Grupo Castillo'
    },
    ...components.map((c, idx) => ({
      name: c.name,
      SPDXID: `SPDXRef-Package-${idx + 1}-${c.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
      versionInfo: c.version,
      downloadLocation: 'NOASSERTION',
      filesAnalyzed: false,
      externalRefs: [
        {
          referenceCategory: 'PACKAGE-MANAGER',
          referenceType: 'purl',
          referenceLocator: c.purl
        }
      ]
    }))
  ];

  return {
    spdxVersion: 'SPDX-2.3',
    dataLicense: 'CC0-1.0',
    SPDXID: 'SPDXRef-DOCUMENT',
    name: `${projectName}-SBOM`,
    documentNamespace: docNamespace,
    creationInfo: {
      creators: ['Tool: Castle Gate Assurance Engine 1.0.0', 'Organization: Grupo Castillo'],
      created: timestamp
    },
    packages: spdxPackages
  };
}

/**
 * Exports SBOM to JSON file.
 * 
 * @param {Object} sbomJson 
 * @param {string} outputDir 
 * @param {string} [fileName='sbom-cyclonedx.json'] 
 * @returns {string} File path
 */
function exportSbomToFile(sbomJson, outputDir, fileName = 'sbom-cyclonedx.json') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const targetPath = path.join(outputDir, fileName);
  fs.writeFileSync(targetPath, JSON.stringify(sbomJson, null, 2), 'utf8');
  return targetPath;
}

module.exports = {
  generateCycloneDxSbom,
  generateSpdxSbom,
  exportSbomToFile
};
