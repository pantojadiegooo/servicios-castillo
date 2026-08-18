const fs = require('fs');
const path = require('path');
const https = require('https');
const Ajv = require('ajv').default;
const addFormats = require('ajv-formats');
const { generateSarifReport } = require('../castle-gate/reports/sarif-generator');

const schemaPath = path.join(__dirname, 'sarif-schema-2.1.0.json');

function fetchSchema(url = 'https://json.schemastore.org/sarif-2.1.0.json') {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(schemaPath)) {
      try {
        return resolve(JSON.parse(fs.readFileSync(schemaPath, 'utf8')));
      } catch (e) {}
    }
    
    function get(currentUrl) {
      https.get(currentUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            fs.writeFileSync(schemaPath, data, 'utf8');
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Failed to parse schema JSON from ${currentUrl}: ${e.message} (Body: ${data.slice(0, 100)})`));
          }
        });
      }).on('error', reject);
    }

    get(url);
  });
}

async function validateSarif() {
  console.log('Fetching OASIS SARIF v2.1.0 Schema...');
  const schema = await fetchSchema();
  console.log('Schema loaded. Initializing Ajv...');

  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateFormats: true
  });
  addFormats(ajv);

  const validate = ajv.compile(schema);

  const sampleFindings = {
    CastleSecurityProbe: {
      secrets: [
        {
          rule: 'AWS Access Key ID',
          cqs_control_id: 'SEC-05.1',
          severity: 'CRITICAL',
          file: 'src/aws-client.js',
          line: 14,
          column: 5,
          description: 'Hardcoded AWS Access Key detected in client config'
        }
      ],
      dangerous_patterns: [
        {
          rule: 'AST_UNSAFE_EVAL',
          cqs_control_id: 'SEC-04.1',
          severity: 'HIGH',
          file: 'src/dynamic-runner.js',
          line: 42,
          column: 1,
          description: 'Direct invocation of eval()'
        }
      ]
    },
    CastleDomSemanticsProbe: [
      {
        rule: 'AXE_COLOR_CONTRAST',
        cqs_control_id: 'ACC-03.1',
        severity: 'HIGH',
        file: 'public/index.html',
        line: 25,
        column: 10,
        description: 'Element has insufficient color contrast'
      }
    ]
  };

  const sarifReport = generateSarifReport({
    detailed_findings: sampleFindings,
    target_system: { name: 'AuditTargetApp', environment: 'production', commit_sha: 'a1b2c3d4e5f678901234567890abcdef12345678' }
  });

  const isValid = validate(sarifReport);

  console.log('================================================================');
  console.log('SARIF v2.1.0 OASIS Schema Official Validation Result:');
  console.log('================================================================');
  console.log('Valid against OASIS SARIF 2.1.0 Schema:', isValid ? 'YES (PASS)' : 'NO (FAIL)');

  if (!isValid) {
    console.error('Validation Errors:');
    console.error(JSON.stringify(validate.errors, null, 2));
    process.exit(1);
  } else {
    console.log('[PASS] Generated SARIF v2.1.0 strictly conforms to official OASIS Schema with 0 schema violations.');
  }
}

validateSarif().catch(err => {
  console.error('Error running validation:', err);
  process.exit(1);
});
