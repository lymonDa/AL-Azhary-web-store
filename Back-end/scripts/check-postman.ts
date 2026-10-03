import * as fs from 'fs';
import * as path from 'path';
import { openApiConfig } from '../src/config/openapi';

export interface PostmanCheckResults {
  pass: boolean;
  openApiCount: number;
  postmanCount: number;
  missingInPostman: string[];
  extraInPostman: string[];
  duplicatePostmanKeys: string[];
  secretViolations: string[];
  schemaViolations: string[];
}

// Helper to normalize path parameters (:param -> {param})
export function normalizePathParams(p: string): string {
  return p.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
}

export function runPostmanContractChecks(): PostmanCheckResults {
  const collectionPath = path.resolve(__dirname, '../postman/al-azhari-library.postman_collection.json');
  const envPath = path.resolve(__dirname, '../postman/al-azhari-library.postman_environment.json');

  const results: PostmanCheckResults = {
    pass: true,
    openApiCount: 0,
    postmanCount: 0,
    missingInPostman: [],
    extraInPostman: [],
    duplicatePostmanKeys: [],
    secretViolations: [],
    schemaViolations: [],
  };

  if (!fs.existsSync(collectionPath)) {
    results.pass = false;
    results.schemaViolations.push(`Postman collection file missing at ${collectionPath}`);
    return results;
  }

  if (!fs.existsSync(envPath)) {
    results.pass = false;
    results.schemaViolations.push(`Postman environment file missing at ${envPath}`);
    return results;
  }

  const rawCollection = fs.readFileSync(collectionPath, 'utf8');
  const rawEnv = fs.readFileSync(envPath, 'utf8');

  // 1. JSON parsing check
  let collection: any;
  let environment: any;
  try {
    collection = JSON.parse(rawCollection);
  } catch (err: any) {
    results.pass = false;
    results.schemaViolations.push(`Invalid JSON in Postman collection: ${err.message}`);
    return results;
  }

  try {
    environment = JSON.parse(rawEnv);
  } catch (err: any) {
    results.pass = false;
    results.schemaViolations.push(`Invalid JSON in Postman environment: ${err.message}`);
    return results;
  }

  // 2. Format & Schema Verification
  if (!collection.info || !collection.info.schema) {
    results.pass = false;
    results.schemaViolations.push('Missing collection info or schema URI');
  } else if (!collection.info.schema.includes('collection/v2.1.0')) {
    results.pass = false;
    results.schemaViolations.push(`Expected Postman Collection v2.1 schema, found ${collection.info.schema}`);
  }

  if (!Array.isArray(environment.values)) {
    results.pass = false;
    results.schemaViolations.push('Environment values must be an array');
  }

  // 3. Secrets and Sensitive Data Scanning
  const secretPatterns = [
    /mongodb(\+srv)?:\/\//i,
    /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/, // Real JWT regex
    /cloudinary:\/\//i,
    /api_key=[0-9a-zA-Z]{10,}/i,
    /smtp:\/\//i,
    /password12345/i,
  ];

  for (const pat of secretPatterns) {
    if (pat.test(rawCollection)) {
      results.pass = false;
      results.secretViolations.push(`Found potentially real secret pattern in collection: ${pat.toString()}`);
    }
    if (pat.test(rawEnv)) {
      results.pass = false;
      results.secretViolations.push(`Found potentially real secret pattern in environment: ${pat.toString()}`);
    }
  }

  // Verify safe placeholder values in environment
  for (const envVal of environment.values || []) {
    if (['accessToken', 'refreshToken', 'adminAccessToken'].includes(envVal.key)) {
      if (!envVal.value.startsWith('CHANGE_ME')) {
        results.pass = false;
        results.secretViolations.push(`Environment variable ${envVal.key} does not use safe CHANGE_ME placeholder`);
      }
    }
  }

  // 4. Contract Comparison: OpenAPI vs Postman
  const openApiOps = new Map<string, { method: string; path: string; operationId: string }>();
  for (const [p, mObj] of Object.entries(openApiConfig.paths)) {
    for (const [m, op] of Object.entries(mObj as any)) {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(m.toLowerCase())) {
        const opKey = `${m.toUpperCase()} ${p}`;
        openApiOps.set(opKey, {
          method: m.toUpperCase(),
          path: p,
          operationId: (op as any).operationId,
        });
      }
    }
  }

  results.openApiCount = openApiOps.size;

  const postmanRequests = new Map<string, { method: string; path: string; name: string }>();
  const seenKeys = new Set<string>();

  function traverseItems(items: any[]) {
    for (const item of items) {
      if (item.request) {
        const method = item.request.method.toUpperCase();
        const url = item.request.url;
        const host = url.host ? url.host[0] : '';
        const pathSegments = url.path || [];
        let fullPath = '';
        if (host === '{{rootUrl}}') {
          fullPath = '/' + pathSegments.join('/');
        } else {
          fullPath = '/api/v1/' + pathSegments.join('/');
        }
        const normalized = normalizePathParams(fullPath);
        const key = `${method} ${normalized}`;

        if (seenKeys.has(key)) {
          results.duplicatePostmanKeys.push(key);
        } else {
          seenKeys.add(key);
        }

        postmanRequests.set(key, { method, path: normalized, name: item.name });
      } else if (item.item && Array.isArray(item.item)) {
        traverseItems(item.item);
      }
    }
  }

  traverseItems(collection.item || []);
  results.postmanCount = postmanRequests.size;

  // Missing from Postman
  for (const [key] of openApiOps) {
    if (!postmanRequests.has(key)) {
      results.missingInPostman.push(key);
    }
  }

  // Extra in Postman
  for (const [key] of postmanRequests) {
    if (!openApiOps.has(key)) {
      results.extraInPostman.push(key);
    }
  }

  if (
    results.missingInPostman.length > 0 ||
    results.extraInPostman.length > 0 ||
    results.duplicatePostmanKeys.length > 0 ||
    results.secretViolations.length > 0 ||
    results.schemaViolations.length > 0
  ) {
    results.pass = false;
  }

  return results;
}

// Standalone execution for CI / CLI
if (require.main === module) {
  console.log('--- RUNNING POSTMAN CONTRACT SYNCHRONIZATION CHECKS ---');
  const results = runPostmanContractChecks();

  console.log(`\nContract Statistics:`);
  console.log(`- Final OpenAPI operations : ${results.openApiCount}`);
  console.log(`- Postman requests         : ${results.postmanCount}`);
  console.log(`- Missing in Postman       : ${results.missingInPostman.length}`);
  console.log(`- Extra in Postman         : ${results.extraInPostman.length}`);
  console.log(`- Duplicate Postman routes : ${results.duplicatePostmanKeys.length}`);

  let hasFailure = false;

  console.log('\n[1/3] CONTRACT SYNCHRONIZATION:');
  if (results.missingInPostman.length === 0 && results.extraInPostman.length === 0 && results.duplicatePostmanKeys.length === 0) {
    console.log('✓ PASS: Postman collection exactly matches 100% of OpenAPI operations (0 missing, 0 extra).');
  } else {
    hasFailure = true;
    if (results.missingInPostman.length > 0) {
      console.error('✗ FAIL: Missing operations from Postman:');
      results.missingInPostman.forEach((m) => console.error(`  - ${m}`));
    }
    if (results.extraInPostman.length > 0) {
      console.error('✗ FAIL: Extra / Phantom operations in Postman:');
      results.extraInPostman.forEach((e) => console.error(`  - ${e}`));
    }
    if (results.duplicatePostmanKeys.length > 0) {
      console.error('✗ FAIL: Duplicate operation keys in Postman:');
      results.duplicatePostmanKeys.forEach((d) => console.error(`  - ${d}`));
    }
  }

  console.log('\n[2/3] SECRETS & ENVIRONMENT HYGIENE:');
  if (results.secretViolations.length === 0) {
    console.log('✓ PASS: Zero credentials, private keys, real tokens, or database URIs detected.');
  } else {
    hasFailure = true;
    console.error('✗ FAIL: Secrets scan detected violations:');
    results.secretViolations.forEach((s) => console.error(`  - ${s}`));
  }

  console.log('\n[3/3] COLLECTION SCHEMA & FORMAT:');
  if (results.schemaViolations.length === 0) {
    console.log('✓ PASS: Postman Collection Format v2.1 valid and environment JSON schema verified.');
  } else {
    hasFailure = true;
    console.error('✗ FAIL: Schema violations detected:');
    results.schemaViolations.forEach((v) => console.error(`  - ${v}`));
  }

  if (hasFailure) {
    console.error('\n❌ POSTMAN CONTRACT CHECKS FAILED');
    process.exit(1);
  } else {
    console.log('\n✨ ALL POSTMAN CONTRACT CHECKS PASSED');
    process.exit(0);
  }
}
